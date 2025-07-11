import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  DollarSign, 
  User, 
  LogOut, 
  Menu,
  X,
  Scissors
} from 'lucide-react';

interface BarberData {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

const BarberLayout = () => {
  const [currentBarber, setCurrentBarber] = useState<BarberData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // التحقق من وجود بيانات الحلاق
    const barberData = localStorage.getItem('currentBarber');
    if (!barberData) {
      navigate('/barber-login');
      return;
    }
    
    setCurrentBarber(JSON.parse(barberData));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('currentBarber');
      navigate('/barber-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      path: '/barber-dashboard',
      name: 'تسجيلات يومية',
      icon: Calendar,
      description: 'تسجيل المبيعات اليومية'
    },
    {
      path: '/barber-dashboard/advances',
      name: 'السلف',
      icon: DollarSign,
      description: 'طلب سلفة جديدة'
    },
    {
      path: '/barber-dashboard/profile',
      name: 'الملف الشخصي',
      icon: User,
      description: 'عرض البيانات والتسجيلات'
    }
  ];

  if (!currentBarber) {
    return null; // أو مكون تحميل
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentBarber.avatar} />
            <AvatarFallback className="bg-green-100 text-green-600">
              {currentBarber.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{currentBarber.name}</p>
            <p className="text-xs text-gray-500">حلاق</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 right-0 z-[60] w-72 h-screen bg-white shadow-xl transform transition-transform duration-300 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : 'lg:translate-x-0 translate-x-full'}
        `}>
          {/* Sidebar Header */}
          <div className="p-6 border-b bg-gradient-to-r from-green-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-800">لمسة إبداعية</h2>
                  <p className="text-sm text-gray-600">بوابة الحلاقين</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Barber Info */}
            <div className="mt-4 p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentBarber.avatar} />
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {currentBarber.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{currentBarber.name}</p>
                  <p className="text-sm text-gray-600">{currentBarber.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full text-right p-4 rounded-lg transition-all duration-200 hover:bg-gray-50 group
                    ${isActive ? 'bg-green-50 border-r-4 border-green-500' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <div className="flex-1 text-right">
                      <div className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-700'}`}>
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:mr-72">
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default BarberLayout;
