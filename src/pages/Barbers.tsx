import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Users,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Barber {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  createdAt: Date;
}

const Barbers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [newBarber, setNewBarber] = useState({
    name: '',
    email: '',
    password: '',
    avatar: ''
  });

  const [barbers, setBarbers] = useState<Barber[]>([]);

  // جلب البيانات من Firebase
  useEffect(() => {
    fetchBarbers();
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
      
      let errorMessage = 'حدث خطأ أثناء تحميل قائمة الحلاقين';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        
        switch (firebaseError.code) {
          case 'permission-denied':
            errorMessage = 'ليس لديك صلاحية للوصول إلى البيانات. يرجى التحقق من إعدادات Firebase';
            break;
          case 'unavailable':
            errorMessage = 'خدمة Firebase غير متاحة حالياً';
            break;
          default:
            errorMessage = firebaseError.message || 'حدث خطأ غير متوقع';
        }
      }
      
      toast({
        title: 'خطأ في تحميل البيانات',
        description: errorMessage,
        variant: 'destructive',
      });
      
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
            joinDate: '2024-01-15',
            createdAt: new Date(),
          },
          {
            id: 'demo-2',
            name: 'أحمد حسن',
            email: 'ahmed@lamsa-ibda3iya.com',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            joinDate: '2024-02-10',
            createdAt: new Date(),
          }
        ]);
        
        toast({
          title: 'عرض بيانات تجريبية',
          description: 'يتم عرض بيانات تجريبية. يرجى إعداد قواعد Firebase للحصول على البيانات الحقيقية',
        });
      }
    } finally {
      setBarbersLoading(false);
    }
  };

  const handleAddBarber = async () => {
    if (!newBarber.name || !newBarber.email || !newBarber.password) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال الاسم والبريد الإلكتروني وكلمة المرور',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // إنشاء حساب جديد في Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newBarber.email, newBarber.password);
      const user = userCredential.user;

      // إضافة بيانات الحلاق إلى Firestore
      const barberData = {
        uid: user.uid,
        name: newBarber.name,
        email: newBarber.email,
        avatar: newBarber.avatar || '',
        createdAt: new Date(),
        joinDate: new Date().toISOString().split('T')[0],
      };

      const docRef = await addDoc(collection(db, 'barbers'), barberData);

      // إضافة الحلاق إلى القائمة المحلية
      setBarbers([...barbers, { id: docRef.id, ...barberData }]);
      
      setNewBarber({
        name: '',
        email: '',
        password: '',
        avatar: ''
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: 'تم إضافة الحلاق بنجاح! 🎉',
        description: `تم إضافة ${newBarber.name} إلى فريق العمل`,
      });

    } catch (error: unknown) {
      console.error('Error adding barber:', error);
      let errorMessage = 'حدث خطأ أثناء إضافة الحلاق';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
            break;
          case 'auth/invalid-email':
            errorMessage = 'البريد الإلكتروني غير صالح';
            break;
          case 'auth/weak-password':
            errorMessage = 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل';
            break;
          default:
            errorMessage = firebaseError.message || 'حدث خطأ غير متوقع';
        }
      }

      toast({
        title: 'فشل إضافة الحلاق',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBarber = async (barberId: string) => {
    try {
      // لا نحذف البيانات التجريبية
      if (barberId.startsWith('demo-')) {
        toast({
          title: 'بيانات تجريبية',
          description: 'لا يمكن حذف البيانات التجريبية. قم بإعداد Firebase أولاً',
          variant: 'destructive',
        });
        return;
      }

      await deleteDoc(doc(db, 'barbers', barberId));
      setBarbers(barbers.filter(barber => barber.id !== barberId));
      toast({
        title: 'تم حذف الحلاق',
        description: 'تم حذف الحلاق من النظام بنجاح',
      });
    } catch (error) {
      console.error('Error deleting barber:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف الحلاق',
        variant: 'destructive',
      });
    }
  };

  const filteredBarbers = barbers.filter(barber =>
    barber.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barber.email?.includes(searchTerm)
  );

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
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open('https://console.firebase.google.com', '_blank')}
              >
                <Settings className="h-4 w-4 ml-2" />
                فتح Firebase Console
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">إدارة الحلاقين</h1>
          <p className="text-sm text-muted-foreground">إدارة ومتابعة فريق الحلاقين</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              إضافة حلاق جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة حلاق جديد</DialogTitle>
              <DialogDescription className="text-right">
                أدخل بيانات الحلاق الجديد للإضافة إلى فريق العمل
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* صورة الحلاق */}
              <div className="grid gap-2">
                <Label htmlFor="avatar" className="text-right">رابط صورة الحلاق</Label>
                <Input
                  id="avatar"
                  type="url"
                  value={newBarber.avatar}
                  onChange={(e) => setNewBarber({ ...newBarber, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                />
                {newBarber.avatar && (
                  <div className="flex justify-center mt-2">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={newBarber.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {newBarber.name ? newBarber.name.split(' ').map(n => n[0]).join('') : 'صورة'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>

              {/* اسم الحلاق */}
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-right">اسم الحلاق *</Label>
                <Input
                  id="name"
                  value={newBarber.name}
                  onChange={(e) => setNewBarber({ ...newBarber, name: e.target.value })}
                  placeholder="أدخل اسم الحلاق"
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                />
              </div>

              {/* البريد الإلكتروني */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-right">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newBarber.email}
                  onChange={(e) => setNewBarber({ ...newBarber, email: e.target.value })}
                  placeholder="example@lamsa-ibda3iya.com"
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                />
              </div>

              {/* كلمة المرور */}
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-right">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newBarber.password}
                    onChange={(e) => setNewBarber({ ...newBarber, password: e.target.value })}
                    placeholder="أدخل كلمة المرور"
                    className="text-right pr-10"
                    dir="rtl"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                onClick={handleAddBarber}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الإضافة...</span>
                  </div>
                ) : (
                  'إضافة الحلاق'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الحلاقين</p>
              <p className="text-xl font-bold">{barbers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Barbers List */}
      {barbersLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">جارٍ تحميل قائمة الحلاقين...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBarbers.map((barber) => (
            <Card key={barber.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12 md:h-16 md:w-16">
                      <AvatarImage src={barber.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {barber.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base md:text-lg text-foreground truncate">
                        {barber.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{barber.email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        انضم في {new Date(barber.joinDate).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteBarber(barber.id)}
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
      {!barbersLoading && filteredBarbers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'لم يتم العثور على حلاقين بالبحث المحدد' : 'لا يوجد حلاقين مسجلين في النظام'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Barbers;