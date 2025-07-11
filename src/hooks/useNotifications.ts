import { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Scissors,
  Receipt,
  LucideIcon
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  userId?: string;
  shopId?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ربط الأيقونات بأنواع الإشعارات
  const getNotificationIcon = (type: string): LucideIcon => {
    switch (type) {
      case 'daily_record': return Calendar;
      case 'advance_request': return DollarSign;
      case 'high_performance': return TrendingUp;
      case 'expense_added': return Receipt;
      case 'barber_login': return Users;
      case 'barber_logout': return Users;
      case 'new_booking': return Scissors;
      case 'system_alert': return AlertCircle;
      default: return CheckCircle;
    }
  };

  // ربط الألوان بأنواع الإشعارات
  const getNotificationColors = (type: string): { color: string; bgColor: string } => {
    switch (type) {
      case 'daily_record': return { color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'advance_request': return { color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'high_performance': return { color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'expense_added': return { color: 'text-red-600', bgColor: 'bg-red-50' };
      case 'barber_login': 
      case 'barber_logout': return { color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'new_booking': return { color: 'text-cyan-600', bgColor: 'bg-cyan-50' };
      case 'system_alert': return { color: 'text-amber-600', bgColor: 'bg-amber-50' };
      default: return { color: 'text-blue-600', bgColor: 'bg-blue-50' };
    }
  };

  // جلب الإشعارات من Firebase وتحديثها في الوقت الفعلي
  useEffect(() => {
    // استعلام للحصول على آخر 20 إشعار مرتبة حسب التاريخ
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    // الاستماع للتغييرات في الوقت الفعلي
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const colors = getNotificationColors(data.type);
        
        fetchedNotifications.push({
          id: doc.id,
          type: data.type,
          title: data.title,
          message: data.message,
          time: data.createdAt ? data.createdAt.toDate() : new Date(),
          read: data.read || false,
          icon: getNotificationIcon(data.type),
          color: colors.color,
          bgColor: colors.bgColor,
          userId: data.userId,
          shopId: data.shopId
        });
      });

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });

    return () => unsubscribe();
  }, []);

  // تحديد الإشعارات كمقروءة في Firebase
  const markAsRead = async (notificationId?: string) => {
    if (notificationId) {
      try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
        
        // تحديث الحالة المحلية
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    } else {
      // تحديد الكل كمقروء
      try {
        const unreadNotifications = notifications.filter(n => !n.read);
        const updatePromises = unreadNotifications.map(notification => {
          const notificationRef = doc(db, 'notifications', notification.id);
          return updateDoc(notificationRef, {
            read: true,
            readAt: serverTimestamp()
          });
        });
        
        await Promise.all(updatePromises);
        
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  // تنسيق وقت الإشعار
  const formatNotificationTime = (time: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  // إضافة إشعار جديد إلى Firebase
  const addNotification = async (notification: {
    type: string;
    title: string;
    message: string;
    userId?: string;
    shopId?: string;
  }) => {
    try {
      const colors = getNotificationColors(notification.type);
      
      const notificationData = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: serverTimestamp(),
        read: false,
        userId: notification.userId || null,
        shopId: notification.shopId || localStorage.getItem('shopId') || null
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      
      // الإشعار سيتم إضافته تلقائياً عبر onSnapshot
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    formatNotificationTime,
    addNotification
  };
};
