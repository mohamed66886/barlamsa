import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Sparkles, Scissors, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CreativeTouchLogo from '@/components/ui/creative-touch-logo';

const Login = () => {
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

      // التحقق من أن المستخدم ليس حلاق
      const barbersQuery = query(
        collection(db, 'barbers'),
        where('uid', '==', user.uid)
      );
      const barberSnapshot = await getDocs(barbersQuery);

      if (!barberSnapshot.empty) {
        // هذا حساب حلاق - تسجيل خروج
        await auth.signOut();
        toast({
          title: 'تنبيه! 👋',
          description: 'هذا حساب حلاق، يتم توجيهك لبوابة الحلاقين المخصصة',
          variant: 'default',
        });
        navigate('/barber-login');
        return;
      }

      // إذا لم يكن حلاق، يُسمح بالدخول كمدير
      toast({
        title: 'مرحباً بك! 🎉',
        description: 'تم تسجيل الدخول بنجاح إلى لوحة التحكم الإدارية',
      });
      navigate('/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMWY1ZjkiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative w-full max-w-md">
        {/* Header with Logo */}


        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              <span>دخول الإدارة</span>
              <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              أدخل بياناتك للوصول إلى لوحة التحكم الإدارية
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-right font-semibold text-slate-700 text-base">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@lamsa-ibda3iya.com"
                    className="text-right bg-slate-50 border-slate-200 h-12 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    dir="rtl"
                    disabled={isLoading}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
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
                    className="text-right bg-slate-50 border-slate-200 h-12 text-base pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>دخول لوحة التحكم</span>
                    <Settings className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center space-y-4">

                
                {/* تحسين زر الانتقال للحلاقين */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">

                    <p className="text-sm text-green-700 mb-3">
                      إذا كنت من فريق الحلاقين، استخدم بوابة الحلاقين المخصصة
                    </p>
                    <button 
                      onClick={() => navigate('/barber-login')}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Scissors className="w-4 h-4" />
                      دخول بوابة الحلاقين
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

export default Login;