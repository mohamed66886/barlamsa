import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatDateArabic, formatTime } from '@/lib/dateUtils';
import { notificationHelpers } from '@/lib/notificationHelpers';
import { 
  Plus, 
  DollarSign,
  Calendar,
  AlertCircle,
  Clock,
  Loader2,
  TrendingDown,
  FileText
} from 'lucide-react';

interface BarberData {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Advance {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  reason: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const BarberAdvances = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [advancesLoading, setAdvancesLoading] = useState(true);
  const [currentBarber, setCurrentBarber] = useState<BarberData | null>(null);
  
  const [newAdvance, setNewAdvance] = useState({
    amount: '',
    reason: ''
  });

  const [advances, setAdvances] = useState<Advance[]>([]);
  const [totalAdvances, setTotalAdvances] = useState(0);

  useEffect(() => {
    // الحصول على بيانات الحلاق
    const barberData = localStorage.getItem('currentBarber');
    if (barberData) {
      const barber = JSON.parse(barberData);
      setCurrentBarber(barber);
      fetchAdvances(barber.id);
    }
  }, []);

  const fetchAdvances = async (barberId: string) => {
    try {
      setAdvancesLoading(true);
      
      // استعلام مبسط بدون orderBy لتجنب مشكلة الفهرس
      const advancesQuery = query(
        collection(db, 'advances'),
        where('barberId', '==', barberId)
      );
      
      const querySnapshot = await getDocs(advancesQuery);
      const advancesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advance[];
      
      // ترتيب البيانات محلياً حسب وقت الإنشاء
      advancesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAdvances(advancesData);
      
      // حساب إجمالي السلف المعتمدة
      const approvedAdvances = advancesData.filter(a => a.status === 'approved');
      const total = approvedAdvances.reduce((sum, advance) => sum + advance.amount, 0);
      setTotalAdvances(total);
      
    } catch (error) {
      console.error('Error fetching advances:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل السلف',
        variant: 'destructive',
      });
    } finally {
      setAdvancesLoading(false);
    }
  };

  const handleAddAdvance = async () => {
    if (!newAdvance.amount || !newAdvance.reason) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال المبلغ وسبب السلفة',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(newAdvance.amount);
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
      const advanceData = {
        barberId: currentBarber!.id,
        barberName: currentBarber!.name,
        amount: amount,
        reason: newAdvance.reason,
        date: now.toISOString().split('T')[0],
        time: formatTime(now),
        status: 'pending' as const,
        createdAt: now,
      };

      const docRef = await addDoc(collection(db, 'advances'), advanceData);
      
      // إضافة السلفة للقائمة المحلية
      const newAdvanceWithId = { id: docRef.id, ...advanceData };
      setAdvances([newAdvanceWithId, ...advances]);
      
      // إنشاء إشعار طلب السلفة
      await notificationHelpers.advanceRequest(currentBarber!.name, amount);
      
      setNewAdvance({ amount: '', reason: '' });
      setIsAddDialogOpen(false);
      
      toast({
        title: 'تم تقديم طلب السلفة! 📋',
        description: `تم تقديم طلب سلفة بمبلغ ${amount} ر.س للمراجعة`,
      });

    } catch (error) {
      console.error('Error adding advance:', error);
      toast({
        title: 'فشل تقديم الطلب',
        description: 'حدث خطأ أثناء تقديم طلب السلفة',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1 text-sm font-medium" variant="outline">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>قيد المراجعة</span>
            </div>
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-medium" variant="outline">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>معتمد</span>
            </div>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 px-3 py-1 text-sm font-medium" variant="outline">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>مرفوض</span>
            </div>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-white" />;
      case 'approved':
        return <DollarSign className="w-4 h-4 text-white" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  if (!currentBarber) {
    return null;
  }

  const pendingAdvances = advances.filter(a => a.status === 'pending');
  const approvedAdvances = advances.filter(a => a.status === 'approved');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة السلف</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>تقديم ومتابعة طلبات السلف - {formatDateArabic(new Date())}</span>
              </p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg px-6 py-3 text-lg font-medium">
                <Plus className="h-5 w-5" />
                طلب سلفة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] z-[70]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-xl">طلب سلفة جديدة</DialogTitle>
                <DialogDescription className="text-right">
                  أدخل مبلغ السلفة وسبب الطلب بوضوح
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* المبلغ */}
                <div className="grid gap-3">
                  <Label htmlFor="amount" className="text-right font-medium">المبلغ المطلوب (ر.س) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newAdvance.amount}
                    onChange={(e) => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                    placeholder="أدخل المبلغ المطلوب"
                    className="text-right text-lg h-12"
                    dir="rtl"
                    disabled={isLoading}
                  />
                </div>

                {/* السبب */}
                <div className="grid gap-3">
                  <Label htmlFor="reason" className="text-right font-medium">سبب السلفة *</Label>
                  <Textarea
                    id="reason"
                    value={newAdvance.reason}
                    onChange={(e) => setNewAdvance({ ...newAdvance, reason: e.target.value })}
                    placeholder="مثال: ظروف طارئة، التزامات شخصية، إصلاح سيارة..."
                    className="text-right min-h-[100px] resize-none"
                    dir="rtl"
                    disabled={isLoading}
                  />
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
                  onClick={handleAddAdvance}
                  disabled={isLoading || !newAdvance.amount || !newAdvance.reason}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ التقديم...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>تقديم الطلب</span>
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
                <p className="text-sm font-medium text-green-600 mb-1">إجمالي السلف المعتمدة</p>
                <p className="text-3xl font-bold text-green-700">{totalAdvances.toLocaleString()}</p>
                <p className="text-sm text-green-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full shadow-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">طلبات قيد المراجعة</p>
                <p className="text-3xl font-bold text-yellow-700">{pendingAdvances.length}</p>
                <p className="text-sm text-yellow-600">طلب</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-blue-700">{advances.length}</p>
                <p className="text-sm text-blue-600">طلب</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advances List */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="w-6 h-6 text-orange-600" />
            سجل السلف
            <Badge variant="secondary" className="mr-2">
              {advances.length} طلب
            </Badge>
          </CardTitle>
          <CardDescription>
            جميع طلبات السلف المقدمة مع حالتها - {formatDateArabic(new Date())}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {advancesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-muted-foreground">جارٍ تحميل السلف...</p>
            </div>
          ) : advances.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">لا توجد سلف بعد</h3>
              <p className="text-muted-foreground mb-6">قم بتقديم طلب السلفة الأولى</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
                طلب سلفة جديدة
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {advances.map((advance, index) => (
                <div key={advance.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                          advance.status === 'approved' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                          advance.status === 'rejected' ? 'bg-gradient-to-br from-red-400 to-rose-500' :
                          'bg-gradient-to-br from-yellow-400 to-orange-500'
                        }`}>
                          {getStatusIcon(advance.status)}
                          <DollarSign className="w-6 h-6 text-white absolute" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <p className="font-bold text-2xl text-gray-900">{advance.amount.toLocaleString()}</p>
                          <div className="flex flex-col sm:items-end gap-1">
                            {getStatusBadge(advance.status)}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{advance.date}</span>
                              <span className="text-gray-300">•</span>
                              <span>{advance.time}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            سبب السلفة:
                          </p>
                          <p className="text-sm text-gray-800 leading-relaxed">{advance.reason}</p>
                        </div>
                      </div>
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

export default BarberAdvances;
