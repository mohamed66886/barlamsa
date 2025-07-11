import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatDateArabic, formatTime, getTodayString, getTodayForNewDay, isToday } from '@/lib/dateUtils';
import { notificationHelpers } from '@/lib/notificationHelpers';
import { 
  Plus, 
  DollarSign,
  Calendar,
  CreditCard,
  Banknote,
  TrendingUp,
  Clock,
  Loader2
} from 'lucide-react';

interface BarberData {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface DailyRecord {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  date: string;
  time: string;
  createdAt: Date;
}

const BarberDailyRecords = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [currentBarber, setCurrentBarber] = useState<BarberData | null>(null);
  
  const [newRecord, setNewRecord] = useState({
    amount: '',
    paymentMethod: ''
  });

  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCash, setTodayCash] = useState(0);
  const [todayCard, setTodayCard] = useState(0);

  useEffect(() => {
    // الحصول على بيانات الحلاق
    const barberData = localStorage.getItem('currentBarber');
    if (barberData) {
      const barber = JSON.parse(barberData);
      setCurrentBarber(barber);
      fetchTodayRecords(barber.id);
    }
  }, []);

  const fetchTodayRecords = async (barberId: string) => {
    try {
      setRecordsLoading(true);
      const today = getTodayForNewDay();
      
      // استعلام Firebase للحصول على تسجيلات اليوم
      const recordsQuery = query(
        collection(db, 'dailyRecords'),
        where('barberId', '==', barberId),
        where('date', '==', today)
      );
      
      const querySnapshot = await getDocs(recordsQuery);
      const recordsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // تأكد من وجود createdAt
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        };
      }) as DailyRecord[];
      
      // ترتيب البيانات محلياً حسب وقت الإنشاء (الأحدث أولاً)
      recordsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRecords(recordsData);
      
      // حساب الإجماليات
      const total = recordsData.reduce((sum, record) => sum + Number(record.amount || 0), 0);
      const cash = recordsData
        .filter(r => r.paymentMethod === 'cash')
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);
      const card = recordsData
        .filter(r => r.paymentMethod === 'card')
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);
      
      setTodayTotal(total);
      setTodayCash(cash);
      setTodayCard(card);
      
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل التسجيلات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.amount || !newRecord.paymentMethod) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال المبلغ وطريقة الدفع',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(newRecord.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'خطأ في المبلغ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const recordData = {
        barberId: currentBarber!.id,
        barberName: currentBarber!.name,
        amount: amount,
        paymentMethod: newRecord.paymentMethod as 'cash' | 'card',
        date: now.toISOString().split('T')[0],
        time: formatTime(now),
        createdAt: now,
      };

      const docRef = await addDoc(collection(db, 'dailyRecords'), recordData);
      
      // إضافة التسجيل للقائمة المحلية
      const newRecordWithId = { id: docRef.id, ...recordData };
      setRecords([newRecordWithId, ...records]);
      
      // تحديث الإجماليات
      setTodayTotal(todayTotal + amount);
      if (newRecord.paymentMethod === 'cash') {
        setTodayCash(todayCash + amount);
      } else {
        setTodayCard(todayCard + amount);
      }
      
      // إنشاء إشعار للتسجيل اليومي
      const clientsCount = records.length + 1; // عدد العملاء الجديد
      const newTotalAmount = todayTotal + amount;
      await notificationHelpers.dailyRecord(currentBarber!.name, clientsCount, newTotalAmount);
      
      // إشعار للأداء المتميز عند الوصول لعدد معين من العملاء
      if (clientsCount >= 10 && clientsCount % 5 === 0) {
        await notificationHelpers.highPerformance(currentBarber!.name, clientsCount);
      }
      
      setNewRecord({ amount: '', paymentMethod: '' });
      setIsAddDialogOpen(false);
      
      toast({
        title: 'تم التسجيل بنجاح! 🎉',
        description: `تم تسجيل مبلغ ${amount.toLocaleString()} ر.س`,
      });

    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: 'فشل التسجيل',
        description: 'حدث خطأ أثناء تسجيل المبلغ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentBarber) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جارٍ تحميل بيانات الحلاق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">التسجيلات اليومية</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>سجل مبيعاتك اليومية - {formatDateArabic(new Date())}</span>
              </p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg px-6 py-3 text-lg font-medium">
                <Plus className="h-5 w-5" />
                تسجيل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[400px] z-[70]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">تسجيل مبيعة جديدة</DialogTitle>
                <DialogDescription className="text-right">
                  أدخل مبلغ المبيعة وطريقة الدفع
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* المبلغ */}
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="text-right font-medium">المبلغ (ر.س) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newRecord.amount}
                    onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                    placeholder="أدخل المبلغ"
                    className="text-right text-lg h-12"
                    dir="rtl"
                    disabled={isLoading}
                  />
                </div>

                {/* طريقة الدفع */}
                <div className="grid gap-3">
                  <Label className="text-right font-medium">طريقة الدفع *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* كارت النقد */}
                    <div 
                      onClick={() => !isLoading && setNewRecord({ ...newRecord, paymentMethod: 'cash' })}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                        ${newRecord.paymentMethod === 'cash' 
                          ? 'border-green-500 bg-green-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-green-300'
                        }
                        ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`
                          p-3 rounded-full 
                          ${newRecord.paymentMethod === 'cash' ? 'bg-green-500' : 'bg-gray-100'}
                        `}>
                          <Banknote className={`w-6 h-6 ${newRecord.paymentMethod === 'cash' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-medium ${newRecord.paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-700'}`}>
                            نقداً
                          </p>
                          <p className="text-sm text-gray-500">دفع كاش</p>
                        </div>
                      </div>
                    </div>

                    {/* كارت الشبكة */}
                    <div 
                      onClick={() => !isLoading && setNewRecord({ ...newRecord, paymentMethod: 'card' })}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                        ${newRecord.paymentMethod === 'card' 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-blue-300'
                        }
                        ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`
                          p-3 rounded-full 
                          ${newRecord.paymentMethod === 'card' ? 'bg-blue-500' : 'bg-gray-100'}
                        `}>
                          <CreditCard className={`w-6 h-6 ${newRecord.paymentMethod === 'card' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-medium ${newRecord.paymentMethod === 'card' ? 'text-blue-700' : 'text-gray-700'}`}>
                            شبكة
                          </p>
                          <p className="text-sm text-gray-500">بطاقة ائتمان</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 flex-col sm:flex-row pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
                >
                  إلغاء
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAddRecord}
                  disabled={isLoading || !newRecord.amount || !newRecord.paymentMethod}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ التسجيل...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>تسجيل المبيعة</span>
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">إجمالي اليوم</p>
                <p className="text-3xl font-bold text-green-700">{todayTotal.toLocaleString()}</p>
                <p className="text-sm text-green-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">نقداً</p>
                <p className="text-3xl font-bold text-emerald-700">{todayCash.toLocaleString()}</p>
                <p className="text-sm text-emerald-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-full shadow-lg">
                <Banknote className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">شبكة</p>
                <p className="text-3xl font-bold text-blue-700">{todayCard.toLocaleString()}</p>
                <p className="text-sm text-blue-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
            تسجيلات اليوم
            <Badge variant="secondary" className="mr-2">
              {records.length} تسجيل
            </Badge>
          </CardTitle>
          <CardDescription>
            جميع المبيعات المسجلة لهذا اليوم - {formatDateArabic(new Date())}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recordsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">جارٍ تحميل التسجيلات...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">لا توجد تسجيلات بعد</h3>
              <p className="text-muted-foreground mb-6">ابدأ بتسجيل مبيعاتك اليومية</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                أول تسجيل
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((record, index) => (
                <div key={record.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-2xl text-gray-900">{record.amount.toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{record.time}</span>
                          <span className="text-gray-300">•</span>
                          <span>تسجيل #{records.length - index}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        className={`
                          ${record.paymentMethod === 'cash' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                          } px-3 py-1 text-sm font-medium
                        `}
                        variant="outline"
                      >
                        <div className="flex items-center gap-2">
                          {record.paymentMethod === 'cash' ? (
                            <Banknote className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          <span>{record.paymentMethod === 'cash' ? 'نقداً' : 'شبكة'}</span>
                        </div>
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">ريال سعودي</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberDailyRecords;
