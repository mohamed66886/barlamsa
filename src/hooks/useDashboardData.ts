import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DashboardStats {
  dailyRevenue: number;
  totalCash: number;
  totalCard: number;
  expenses: number;
  netProfit: number;
  activeBarbers: number;
}

export interface RecentUpdate {
  id: string;
  type: 'appointment' | 'payment' | 'barber' | 'expense';
  title: string;
  description: string;
  time: string;
  timestamp: Date;
}

export const useDashboardData = (selectedPeriod: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    dailyRevenue: 0,
    totalCash: 0,
    totalCard: 0,
    expenses: 0,
    netProfit: 0,
    activeBarbers: 0,
  });
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // دالة للتحقق من اتصال قاعدة البيانات وإجراء اختبار سريع
  const checkDatabaseConnection = async () => {
    try {
      console.log('🔍 جاري التحقق من اتصال قاعدة البيانات...');
      
      // اختبار الاتصال مع كل مجموعة
      const collections = ['barbers', 'dailyRecords', 'expenseRecords', 'advances'];
      
      for (const collectionName of collections) {
        const testQuery = query(collection(db, collectionName), limit(5));
        const snapshot = await getDocs(testQuery);
        console.log(`📊 مجموعة ${collectionName}: ${snapshot.size} سجل`);
        
        // طباعة أول سجل كمثال
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0];
          console.log(`📄 مثال من ${collectionName}:`, firstDoc.data());
        }
      }
      
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
      return false;
    }
  };

  // دالة لحساب تاريخ البداية حسب الفترة المختارة
  const getStartDate = (period: string): Date => {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      }
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  };

  // دالة لتنسيق وقت التحديث
  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return timestamp.toLocaleDateString('ar-SA');
  };

  // جلب بيانات المبيعات والدفعات من dailyRecords
  const fetchPaymentsData = async (startDate: Date) => {
    try {
      console.log('💰 جاري جلب بيانات المبيعات من dailyRecords...');
      const paymentsQuery = query(
        collection(db, 'dailyRecords'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );

      const paymentsSnapshot = await getDocs(paymentsQuery);
      console.log('📊 عدد السجلات المالية الموجودة:', paymentsSnapshot.size);
      
      let totalRevenue = 0;
      let totalCash = 0;
      let totalCard = 0;

      paymentsSnapshot.forEach((doc) => {
        const payment = doc.data();
        const amount = payment.amount || 0;
        console.log('💵 سجل مالي:', { id: doc.id, amount, paymentMethod: payment.paymentMethod, barberName: payment.barberName });
        totalRevenue += amount;
        
        if (payment.paymentMethod === 'cash') {
          totalCash += amount;
        } else if (payment.paymentMethod === 'card') {
          totalCard += amount;
        }
      });

      console.log('💰 إجمالي البيانات المالية:', { totalRevenue, totalCash, totalCard });
      return { totalRevenue, totalCash, totalCard };
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات المبيعات:', error);
      return { totalRevenue: 0, totalCash: 0, totalCard: 0 };
    }
  };

  // جلب بيانات المصروفات من expenseRecords
  const fetchExpensesData = async (startDate: Date) => {
    try {
      console.log('💸 جاري جلب بيانات المصروفات من expenseRecords...');
      const expensesQuery = query(
        collection(db, 'expenseRecords'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );

      const expensesSnapshot = await getDocs(expensesQuery);
      console.log('📊 عدد سجلات المصروفات الموجودة:', expensesSnapshot.size);
      
      let totalExpenses = 0;

      expensesSnapshot.forEach((doc) => {
        const expense = doc.data();
        const amount = expense.amount || 0;
        console.log('💸 سجل مصروف:', { id: doc.id, amount, description: expense.description });
        totalExpenses += amount;
      });

      console.log('💸 إجمالي المصروفات:', totalExpenses);
      return totalExpenses;
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات المصروفات:', error);
      return 0;
    }
  };

  // جلب عدد الحلاقين النشطين (إزالة فلتر isActive لأنه قد لا يكون موجود)
  const fetchBarbersCount = async () => {
    try {
      const barbersQuery = query(collection(db, 'barbers'));
      const barbersSnapshot = await getDocs(barbersQuery);
      return barbersSnapshot.size;
    } catch (error) {
      console.error('Error fetching barbers count:', error);
      return 0;
    }
  };

  // جلب آخر التحديثات
  const fetchRecentUpdates = async () => {
    try {
      const updates: RecentUpdate[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // جلب آخر التسجيلات اليومية (المبيعات)
      const dailyRecordsQuery = query(
        collection(db, 'dailyRecords'),
        where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const dailyRecordsSnapshot = await getDocs(dailyRecordsQuery);
      dailyRecordsSnapshot.forEach((doc) => {
        const record = doc.data();
        const timestamp = record.createdAt?.toDate() || new Date();
        updates.push({
          id: `payment-${doc.id}`,
          type: 'payment',
          title: 'مبيعة جديدة',
          description: `تم تسجيل ${record.amount || 0} ر.س من ${record.barberName || 'حلاق'} ${record.paymentMethod === 'cash' ? 'نقداً' : 'بالبطاقة'}`,
          time: formatTimeAgo(timestamp),
          timestamp,
        });
      });

      // جلب آخر السلف
      const advancesQuery = query(
        collection(db, 'advances'),
        where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
        orderBy('createdAt', 'desc'),
        limit(3)
      );

      const advancesSnapshot = await getDocs(advancesQuery);
      advancesSnapshot.forEach((doc) => {
        const advance = doc.data();
        const timestamp = advance.createdAt?.toDate() || new Date();
        updates.push({
          id: `advance-${doc.id}`,
          type: 'barber',
          title: 'سلفة جديدة',
          description: `تم صرف سلفة ${advance.amount || 0} ر.س لـ ${advance.barberName || 'حلاق'}`,
          time: formatTimeAgo(timestamp),
          timestamp,
        });
      });

      // جلب آخر المصروفات
      const expensesQuery = query(
        collection(db, 'expenseRecords'),
        where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
        orderBy('createdAt', 'desc'),
        limit(3)
      );

      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.forEach((doc) => {
        const expense = doc.data();
        const timestamp = expense.createdAt?.toDate() || new Date();
        updates.push({
          id: `expense-${doc.id}`,
          type: 'expense',
          title: 'مصروف جديد',
          description: `تم إضافة مصروف ${expense.description || 'عام'} بقيمة ${expense.amount || 0} ر.س`,
          time: formatTimeAgo(timestamp),
          timestamp,
        });
      });

      // ترتيب التحديثات حسب الوقت
      updates.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return updates.slice(0, 8); // أحدث 8 تحديثات

    } catch (error) {
      console.error('Error fetching recent updates:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // التحقق من اتصال قاعدة البيانات أولاً
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
          setError('فشل الاتصال بقاعدة البيانات. تحقق من إعدادات Firebase.');
          return;
        }

        console.log('🔄 جاري جلب بيانات Dashboard للفترة:', selectedPeriod);
        const startDate = getStartDate(selectedPeriod);
        console.log('📅 تاريخ البداية:', startDate);
        
        const [paymentsData, totalExpenses, activeBarbers, updates] = await Promise.all([
          fetchPaymentsData(startDate),
          fetchExpensesData(startDate),
          fetchBarbersCount(),
          fetchRecentUpdates(),
        ]);

        console.log('💰 بيانات المبيعات:', paymentsData);
        console.log('💸 إجمالي المصروفات:', totalExpenses);
        console.log('👥 عدد الحلاقين:', activeBarbers);
        console.log('🔔 التحديثات الأخيرة:', updates.length);

        const netProfit = paymentsData.totalRevenue - totalExpenses;

        setStats({
          dailyRevenue: paymentsData.totalRevenue,
          totalCash: paymentsData.totalCash,
          totalCard: paymentsData.totalCard,
          expenses: totalExpenses,
          netProfit,
          activeBarbers,
        });

        setRecentUpdates(updates);

        // إذا لم تكن هناك بيانات، أظهر رسالة إرشادية
        if (paymentsData.totalRevenue === 0 && totalExpenses === 0 && activeBarbers === 0) {
          console.log('ℹ️ لا توجد بيانات في قاعدة البيانات');
        }

      } catch (err) {
        console.error('❌ خطأ في جلب بيانات Dashboard:', err);
        setError('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // دالة إعادة جلب البيانات
  const refetch = () => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const startDate = getStartDate(selectedPeriod);
        
        const [paymentsData, totalExpenses, activeBarbers, updates] = await Promise.all([
          fetchPaymentsData(startDate),
          fetchExpensesData(startDate),
          fetchBarbersCount(),
          fetchRecentUpdates(),
        ]);

        const netProfit = paymentsData.totalRevenue - totalExpenses;

        setStats({
          dailyRevenue: paymentsData.totalRevenue,
          totalCash: paymentsData.totalCash,
          totalCard: paymentsData.totalCard,
          expenses: totalExpenses,
          netProfit,
          activeBarbers,
        });

        setRecentUpdates(updates);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  return {
    stats,
    recentUpdates,
    loading,
    error,
    refetch,
  };
};
