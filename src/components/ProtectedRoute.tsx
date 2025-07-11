import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  type: 'admin' | 'barber';
}

const ProtectedRoute = ({ children, type }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // المستخدم غير مسجل الدخول
        if (type === 'admin') {
          navigate('/login');
        } else {
          navigate('/barber-login');
        }
        setIsLoading(false);
        return;
      }

      // التحقق من نوع المستخدم
      if (type === 'barber') {
        // التحقق من وجود بيانات الحلاق في localStorage
        const barberData = localStorage.getItem('currentBarber');
        if (barberData) {
          const barber = JSON.parse(barberData);
          if (barber.uid === user.uid) {
            setIsAuthorized(true);
          } else {
            navigate('/barber-login');
          }
        } else {
          navigate('/barber-login');
        }
      } else {
        // للإدارة، التحقق من أن المستخدم ليس حلاق
        const barberData = localStorage.getItem('currentBarber');
        if (barberData) {
          // إذا كان مسجل كحلاق، إرساله لصفحة الحلاقين
          navigate('/barber-dashboard');
        } else {
          setIsAuthorized(true);
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, type]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جارٍ التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
