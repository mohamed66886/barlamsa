import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LogOut, Menu, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '@/lib/dateUtils';
import { useState, useEffect } from 'react';

const Header = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const currentUser = {
    name: 'أحمد محمد',
    role: 'مدير المحل',
    avatar: '',
  };

  // تحديث الوقت كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Right side - Sidebar trigger and title */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9 text-foreground hover:bg-accent rounded-lg transition-colors" />
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
              <span className="hidden sm:inline">نظام إدارة محل الحلاقة</span>
              <span className="sm:hidden">إدارة المحل</span>
            </h1>
            <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{formatTime(currentTime)} - {new Date().toLocaleDateString('ar-EG', { weekday: 'short', calendar: 'gregory' })}</span>
            </div>
          </div>
        </div>

        {/* Center - Time display on mobile */}
        <div className="sm:hidden flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-foreground">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Left side - User info and notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-destructive text-[10px] sm:text-xs text-destructive-foreground flex items-center justify-center font-bold animate-pulse">
              2
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto px-2 sm:px-3 gap-2 rounded-full hover:bg-accent transition-all duration-200">
                {/* Desktop view */}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {currentUser.role}
                  </p>
                </div>
                <Avatar className="h-8 w-8 border-2 border-background shadow-md">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* Mobile menu icon */}
                <Menu className="h-3 w-3 sm:hidden ml-1 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 shadow-lg border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal bg-muted/50">
                <div className="flex flex-col space-y-1 text-right">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="text-right cursor-pointer hover:bg-accent transition-colors">
                <User className="ml-2 h-4 w-4" />
                <span>الملف الشخصي</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-right cursor-pointer hover:bg-accent transition-colors">
                <Settings className="ml-2 h-4 w-4" />
                <span>الإعدادات</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-right text-destructive cursor-pointer hover:bg-destructive/10 transition-colors">
                <LogOut className="ml-2 h-4 w-4" />
                <span>تسجيل خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;