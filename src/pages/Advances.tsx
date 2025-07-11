import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Trash2, 
  DollarSign,
  Calendar,
  User,
  AlertTriangle,
  Loader2,
  TrendingDown,
  Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Barber {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Advance {
  id: string;
  barberId: string;
  barberName: string;
  barberAvatar: string;
  amount: number;
  date: string;
  reason: string;
  createdAt: Date;
}

const Advances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [advancesLoading, setAdvancesLoading] = useState(true);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  const [newAdvance, setNewAdvance] = useState({
    barberId: '',
    amount: '',
    reason: ''
  });

  const [advances, setAdvances] = useState<Advance[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  // جلب البيانات من Firebase
  useEffect(() => {
    fetchBarbers();
    fetchAdvances();
  }, []);

  const fetchBarbers = async () => {
    try {
      setBarbersLoading(true);
      const querySnapshot = await getDocs(collection(db, 'barbers'));
      const barbersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Barber[];
      setBarbers(barbersData);
    } catch (error: unknown) {
      console.error('Error fetching barbers:', error);
      
      // في حالة عدم وجود صلاحيات، نعرض بيانات تجريبية
      if (error && typeof error === 'object' && 'code' in error && 
          (error as { code: string }).code === 'permission-denied') {
        setHasPermissionError(true);
        setBarbers([
          {
            id: 'demo-1',
            name: 'خالد العلي',
            email: 'khalid@lamsa-ibda3iya.com',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          },
          {
            id: 'demo-2',
            name: 'أحمد حسن',
            email: 'ahmed@lamsa-ibda3iya.com',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ]);
      }
    } finally {
      setBarbersLoading(false);
    }
  };

  const fetchAdvances = async () => {
    try {
      setAdvancesLoading(true);
      const q = query(collection(db, 'advances'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const advancesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advance[];
      setAdvances(advancesData);
    } catch (error: unknown) {
      console.error('Error fetching advances:', error);
      
      // في حالة عدم وجود صلاحيات، نعرض بيانات تجريبية
      if (error && typeof error === 'object' && 'code' in error && 
          (error as { code: string }).code === 'permission-denied') {
        setAdvances([
          {
            id: 'demo-adv-1',
            barberId: 'demo-1',
            barberName: 'خالد العلي',
            barberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            amount: 500,
            date: '2024-07-10',
            reason: 'مصاريف شخصية طارئة',
            createdAt: new Date(),
          },
          {
            id: 'demo-adv-2',
            barberId: 'demo-2',
            barberName: 'أحمد حسن',
            barberAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            amount: 300,
            date: '2024-07-08',
            reason: 'سلفة راتب',
            createdAt: new Date(),
          }
        ]);
      }
    } finally {
      setAdvancesLoading(false);
    }
  };

  const handleAddAdvance = async () => {
    if (!newAdvance.barberId || !newAdvance.amount || !newAdvance.reason) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
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
      // البحث عن بيانات الحلاق
      const selectedBarber = barbers.find(b => b.id === newAdvance.barberId);
      if (!selectedBarber) {
        throw new Error('الحلاق غير موجود');
      }

      // إضافة السلفة إلى Firestore
      const advanceData = {
        barberId: newAdvance.barberId,
        barberName: selectedBarber.name,
        barberAvatar: selectedBarber.avatar,
        amount: amount,
        reason: newAdvance.reason,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'advances'), advanceData);

      // إضافة السلفة إلى القائمة المحلية
      setAdvances([{ id: docRef.id, ...advanceData }, ...advances]);
      
      setNewAdvance({
        barberId: '',
        amount: '',
        reason: ''
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: 'تم إضافة السلفة بنجاح! 💰',
        description: `تم تسجيل سلفة ${amount} ر.س لـ ${selectedBarber.name}`,
      });

    } catch (error: unknown) {
      console.error('Error adding advance:', error);
      let errorMessage = 'حدث خطأ أثناء إضافة السلفة';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

      toast({
        title: 'فشل إضافة السلفة',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdvance = async (advanceId: string) => {
    try {
      // لا نحذف البيانات التجريبية
      if (advanceId.startsWith('demo-')) {
        toast({
          title: 'بيانات تجريبية',
          description: 'لا يمكن حذف البيانات التجريبية. قم بإعداد Firebase أولاً',
          variant: 'destructive',
        });
        return;
      }

      await deleteDoc(doc(db, 'advances', advanceId));
      setAdvances(advances.filter(advance => advance.id !== advanceId));
      toast({
        title: 'تم حذف السلفة',
        description: 'تم حذف السلفة من النظام بنجاح',
      });
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف السلفة',
        variant: 'destructive',
      });
    }
  };

  const filteredAdvances = advances.filter(advance =>
    advance.barberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAdvances = advances.reduce((total, advance) => total + advance.amount, 0);
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* تنبيه إعداد Firebase */}
      {hasPermissionError && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-right">
            <div className="space-y-2">
              <p className="font-medium text-orange-800">
                تحتاج لإعداد قواعد Firebase لعمل النظام بشكل كامل
              </p>
              <div className="text-sm text-orange-700">
                <p>• اذهب إلى <strong>Firebase Console</strong></p>
                <p>• افتح <strong>Firestore Database &gt; Rules</strong></p>
                <p>• اقرأ ملف <strong>FIREBASE_SETUP.md</strong> للتعليمات الكاملة</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">سلف الحلاقين</h1>
          <p className="text-sm text-muted-foreground">إدارة السلف والمبالغ المقدمة للحلاقين</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              إضافة سلفة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة سلفة جديدة</DialogTitle>
              <DialogDescription className="text-right">
                أدخل بيانات السلفة للحلاق
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* اختيار الحلاق */}
              <div className="grid gap-2">
                <Label htmlFor="barber" className="text-right">الحلاق *</Label>
                <Select 
                  value={newAdvance.barberId} 
                  onValueChange={(value) => setNewAdvance({ ...newAdvance, barberId: value })}
                  disabled={isLoading || barbersLoading}
                >
                  <SelectTrigger className="text-right" dir="rtl">
                    <SelectValue placeholder="اختر الحلاق" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={barber.avatar} />
                            <AvatarFallback className="text-xs">
                              {barber.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{barber.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* المبلغ */}
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-right">المبلغ (ر.س) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newAdvance.amount}
                  onChange={(e) => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                  placeholder="0.00"
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* السبب */}
              <div className="grid gap-2">
                <Label htmlFor="reason" className="text-right">سبب السلفة *</Label>
                <Input
                  id="reason"
                  value={newAdvance.reason}
                  onChange={(e) => setNewAdvance({ ...newAdvance, reason: e.target.value })}
                  placeholder="مثال: مصاريف شخصية، سلفة راتب..."
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                إلغاء
              </Button>
              <Button 
                type="button" 
                onClick={handleAddAdvance}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الإضافة...</span>
                  </div>
                ) : (
                  'إضافة السلفة'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي السلف</p>
                <p className="text-xl font-bold text-red-600">{totalAdvances.toFixed(2)} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">عدد السلف</p>
                <p className="text-xl font-bold">{advances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط السلفة</p>
                <p className="text-xl font-bold">
                  {advances.length > 0 ? (totalAdvances / advances.length).toFixed(2) : '0.00'} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث باسم الحلاق أو سبب السلفة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advances List */}
      {advancesLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">جارٍ تحميل قائمة السلف...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAdvances.map((advance) => (
            <Card key={advance.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12 md:h-16 md:w-16">
                      <AvatarImage src={advance.barberAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {advance.barberName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base md:text-lg text-foreground">
                        {advance.barberName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {advance.reason}
                      </p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(advance.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <Badge variant="destructive" className="text-sm">
                          <DollarSign className="h-3 w-3 ml-1" />
                          {advance.amount.toFixed(2)} ر.س
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteAdvance(advance.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!advancesLoading && filteredAdvances.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'لم يتم العثور على سلف بالبحث المحدد' : 'لا توجد سلف مسجلة في النظام'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Advances;