import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  userId?: string;
  shopId?: string;
}

export const createNotification = async (data: NotificationData) => {
  try {
    const notificationData = {
      type: data.type,
      title: data.title,
      message: data.message,
      createdAt: serverTimestamp(),
      read: false,
      userId: data.userId || null,
      shopId: data.shopId || localStorage.getItem('shopId') || null
    };

    await addDoc(collection(db, 'notifications'), notificationData);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// دوال مساعدة لإنشاء إشعارات شائعة
export const notificationHelpers = {
  // إشعار سجل يومي جديد
  dailyRecord: (barberName: string, clientsCount: number, earnings: number) => 
    createNotification({
      type: 'daily_record',
      title: 'سجل يومي جديد',
      message: `${barberName} سجل يوم عمل جديد - ${clientsCount} عملاء، ${earnings} ر.س`
    }),

  // إشعار طلب سلفة
  advanceRequest: (barberName: string, amount: number) => 
    createNotification({
      type: 'advance_request',
      title: 'طلب سلفة جديد',
      message: `${barberName} طلب سلفة بقيمة ${amount} ر.س`
    }),

  // إشعار أداء متميز
  highPerformance: (barberName: string, clientsCount: number) => 
    createNotification({
      type: 'high_performance',
      title: 'أداء متميز',
      message: `${barberName} حقق أعلى إيرادات اليوم - ${clientsCount} عميل`
    }),

  // إشعار مصروف جديد
  expenseAdded: (expenseType: string, amount: number) => 
    createNotification({
      type: 'expense_added',
      title: 'مصروف جديد',
      message: `تم إضافة مصروف: ${expenseType} - ${amount} ر.س`
    }),

  // إشعار تسجيل دخول الحلاق
  barberLogin: (barberName: string) => 
    createNotification({
      type: 'barber_login',
      title: 'حلاق متصل',
      message: `${barberName} سجل الدخول للنظام`
    }),

  // إشعار تسجيل خروج الحلاق
  barberLogout: (barberName: string) => 
    createNotification({
      type: 'barber_logout',
      title: 'حلاق غير متصل',
      message: `${barberName} سجل الخروج من النظام`
    }),

  // إشعار تنبيه النظام
  systemAlert: (title: string, message: string) => 
    createNotification({
      type: 'system_alert',
      title,
      message
    })
};
