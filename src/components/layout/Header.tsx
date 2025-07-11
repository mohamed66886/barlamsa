import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  Bell, 
  LogOut, 
  Menu, 
  Settings, 
  User, 
  Clock,
  Scissors,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime, formatDateArabic } from '@/lib/dateUtils';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Header = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { notifications, unreadCount, markAsRead, formatNotificationTime } = useNotifications();
  
  // بيانات المحل من Firebase
  const [shopData, setShopData] = useState({
    name: 'محل الحلاقة',
    ownerName: 'مدير المحل',
    status: 'مفتوح'
  });

  // بيانات المستخدم من Firebase
  const [currentUser, setCurrentUser] = useState({
    name: 'أحمد محمد',
    role: 'مدير المحل',
    avatar: '',
  });

  // جلب بيانات المحل والمستخدم من Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopId = localStorage.getItem('shopId') || 'default-shop';
        
        // جلب بيانات المحل
        const shopDoc = await getDoc(doc(db, 'shops', shopId));
        if (shopDoc.exists()) {
          const shopFirebaseData = shopDoc.data();
          setShopData({
            name: shopFirebaseData.name || 'محل الحلاقة',
            ownerName: shopFirebaseData.ownerName || 'مدير المحل',
            status: shopFirebaseData.status || 'مفتوح'
          });
        }

        // جلب بيانات المدير
        const managerDoc = await getDoc(doc(db, 'managers', shopId));
        if (managerDoc.exists()) {
          const managerFirebaseData = managerDoc.data();
          setCurrentUser({
            name: managerFirebaseData.name || 'أحمد محمد',
            role: managerFirebaseData.role || 'مدير المحل',
            avatar: managerFirebaseData.avatar || ''
          });
        }
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        // في حالة الخطأ، استخدم البيانات من localStorage كبديل
        const savedShopData = localStorage.getItem('shopData');
        if (savedShopData) {
          try {
            const parsedData = JSON.parse(savedShopData);
            setShopData({
              name: parsedData.name || 'محل الحلاقة',
              ownerName: parsedData.ownerName || 'مدير المحل',
              status: parsedData.status || 'مفتوح'
            });
            setCurrentUser(prev => ({
              ...prev,
              name: parsedData.ownerName || prev.name,
            }));
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }
      }
    };

    fetchData();
  }, []);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تحديد أيقونة حالة النشاط بناءً على حالة المحل
  const getActivityIcon = () => {
    const hour = currentTime.getHours();
    const isBusinessHours = hour >= 9 && hour <= 22;
    
    // استخدم حالة المحل من Firebase أولاً، ثم ساعات العمل كبديل
    if (shopData.status === 'مفتوح' || (shopData.status === 'تلقائي' && isBusinessHours)) {
      return { color: 'bg-green-500', text: 'مفتوح', pulse: true };
    } else {
      return { color: 'bg-red-500', text: 'مغلق', pulse: false };
    }
  };

  const activityStatus = getActivityIcon();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4">
        {/* Right side - Sidebar trigger and title */}
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger className="h-8 w-8 sm:h-10 sm:w-10 text-foreground hover:bg-accent rounded-xl transition-all duration-200 shadow-sm" />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-foreground leading-tight truncate">
                <span className="hidden sm:inline">{shopData.name}</span>
                <span className="sm:hidden">
                  {shopData.name.length > 15 ? shopData.name.substring(0, 15) + '...' : shopData.name}
                </span>
              </h1>
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium text-white ${activityStatus.color} border-0 ${activityStatus.pulse ? 'animate-pulse' : ''} shrink-0`}
              >
                {shopData.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(currentTime)}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDateArabic(new Date())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile time display */}
        <div className="sm:hidden flex items-center gap-2 bg-muted/60 rounded-full px-2 py-1 text-xs">
          <Clock className="w-3 h-3 text-primary" />
          <span className="font-medium text-foreground">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Left side - Notifications and User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl hover:bg-accent transition-all duration-200">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse border-2 border-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0 shadow-xl border-border" align="end">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">الإشعارات</h3>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {unreadCount} جديد
                  </Badge>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div 
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-primary/5 border-r-4 border-primary' : ''
                          }`}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${notification.bgColor} flex-shrink-0`}>
                              <IconComponent className={`w-4 h-4 ${notification.color}`} />
                            </div>
                            <div className="flex-1 text-right">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatNotificationTime(notification.time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-muted/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => markAsRead()}
                  >
                    تحديد الكل كمقروء
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 sm:h-12 w-auto px-2 sm:px-3 gap-2 sm:gap-3 rounded-xl hover:bg-accent transition-all duration-200 border border-transparent hover:border-border">
                {/* Desktop view */}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold leading-none text-foreground">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Scissors className="w-3 h-3" />
                    {currentUser.role}
                  </p>
                </div>
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="text-xs sm:text-sm font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* Mobile menu indicator */}
                <Menu className="h-3 w-3 sm:hidden opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 shadow-xl border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
                <div className="flex items-center gap-3 text-right py-2">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-base font-bold leading-none text-foreground">{currentUser.name}</p>
                    <p className="text-sm leading-none text-muted-foreground mt-2 flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {currentUser.role}
                    </p>
                    <Badge variant="secondary" className={`text-xs font-medium text-white ${activityStatus.color} border-0 mt-2`}>
                      {shopData.status}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="text-right cursor-pointer hover:bg-accent transition-colors py-3">
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-right cursor-pointer hover:bg-accent transition-colors py-3">
                <Settings className="ml-3 h-5 w-5 text-primary" />
                <span className="font-medium">الإعدادات</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-right text-destructive cursor-pointer hover:bg-destructive/10 transition-colors py-3">
                <LogOut className="ml-3 h-5 w-5" />
                <span className="font-medium">تسجيل خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;