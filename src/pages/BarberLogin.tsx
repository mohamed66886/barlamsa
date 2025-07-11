import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Scissors, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BarberLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // تسجيل الدخول في Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // التحقق من أن المستخدم حلاق
      const barbersQuery = query(
        collection(db, 'barbers'),
        where('uid', '==', user.uid)
      );
      const barberSnapshot = await getDocs(barbersQuery);

      if (barberSnapshot.empty) {
        // ليس حلاق - تسجيل خروج
        await auth.signOut();
        toast({
          title: 'تنبيه! ⚠️',
          description: 'هذا الحساب مخصص للإدارة، يتم توجيهك لصفحة الإدارة',
          variant: 'default',
        });
        navigate('/login');
        return;
      }

      // الحصول على بيانات الحلاق
      const barberData = barberSnapshot.docs[0].data();
      
      // حفظ بيانات الحلاق في localStorage
      localStorage.setItem('currentBarber', JSON.stringify({
        id: barberSnapshot.docs[0].id,
        uid: user.uid,
        ...barberData
      }));

      toast({
        title: 'أهلاً وسهلاً! 🎉',
        description: `مرحباً ${barberData.name} في بوابة الحلاقين`,
      });

      navigate('/barber-dashboard');
    } catch (error: unknown) {
      console.error('Login error:', error);
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            errorMessage = 'البريد الإلكتروني غير مسجل';
            break;
          case 'auth/wrong-password':
            errorMessage = 'كلمة المرور غير صحيحة';
            break;
          case 'auth/invalid-email':
            errorMessage = 'البريد الإلكتروني غير صالح';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'تم إجراء محاولات كثيرة، يرجى المحاولة لاحقاً';
            break;
          default:
            errorMessage = firebaseError.message || 'حدث خطأ غير متوقع';
        }
      }
      
      toast({
        title: 'فشل تسجيل الدخول',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 px-4 py-8">
      <div className="relative w-full max-w-md">
        {/* Header */}


        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <Scissors className="w-6 h-6 text-green-600" />
              <span>دخول الحلاقين</span>
              <div className="w-6 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              أدخل بياناتك للوصول إلى بوابة الحلاقين
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-right font-semibold text-slate-700 text-base">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="barber@lamsa-ibda3iya.com"
                  className="text-right bg-slate-50 border-slate-200 h-12 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  dir="rtl"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-right font-semibold text-slate-700 text-base">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="text-right bg-slate-50 border-slate-200 h-12 text-base pr-12 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    dir="rtl"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded-full hover:bg-slate-100"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>دخول بوابة الحلاقين</span>
                    <Scissors className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center space-y-4">

                
                {/* تحسين زر الانتقال للإدارة */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">

                    <p className="text-sm text-blue-700 mb-3">
                      إذا كنت من الإدارة أو المديرين، استخدم لوحة التحكم الإدارية
                    </p>
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Settings className="w-4 h-4" />
                      دخول لوحة التحكم الإدارية
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            © 2024 لمسة إبداعية - صالون الحلاقة. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarberLogin;
