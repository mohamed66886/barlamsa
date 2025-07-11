import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Users,
  TrendingUp,
  DollarSign,
  Receipt,
  Settings,
  Scissors,
  Star,
} from 'lucide-react';

const menuItems = [
  {
    title: 'الصفحة الرئيسية',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'إدارة الحلاقين',
    url: '/barbers',
    icon: Users,
  },
  {
    title: 'تتبع الأداء',
    url: '/performance',
    icon: TrendingUp,
  },
  {
    title: 'السلف',
    url: '/advances',
    icon: DollarSign,
  },
  {
    title: 'المصروفات',
    url: '/expenses',
    icon: Receipt,
  },
  {
    title: 'الإعدادات',
    url: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  // بيانات المحل من localStorage
  const [shopData, setShopData] = useState({
    name: 'صالون الحلاقة',
    ownerName: 'مدير المحل',
  });

  useEffect(() => {
    const savedShopData = localStorage.getItem('shopData');
    if (savedShopData) {
      try {
        const parsedData = JSON.parse(savedShopData);
        setShopData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error('Error parsing shop data:', error);
      }
    }
  }, []);

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary text-primary-foreground shadow-md' 
      : 'hover:bg-accent hover:text-accent-foreground transition-all duration-200';

  return (
    <Sidebar side="right" className={collapsed ? 'w-16' : 'w-sidebar'} collapsible="icon">
      <SidebarContent className="bg-background border-l border-border shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-l from-muted/50 to-background">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Scissors className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            {!collapsed && (
              <div className="text-right flex-1">
                <h2 className="text-xl font-bold text-foreground leading-tight">{shopData.name}</h2>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">
                    مفتوح
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-muted-foreground">4.8</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{shopData.ownerName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1 py-6">
          <SidebarGroupLabel className="text-right px-6 py-3 text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {!collapsed && 'القائمة الرئيسية'}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => 
                        `relative flex items-center gap-4 px-4 py-4 text-sm font-medium rounded-xl mx-2 transition-all duration-200 group ${getNavClass({ isActive })}`
                      }
                    >
                      <div className="relative">
                        <item.icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''} transition-transform duration-200 group-hover:scale-110`} />
                      </div>
                      {!collapsed && (
                        <span className="text-right flex-1 font-medium">{item.title}</span>
                      )}
                      {/* Active indicator */}
                      {currentPath === item.url && !collapsed && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom section */}
        {!collapsed && (
          <div className="mt-auto p-6 border-t border-border bg-gradient-to-l from-muted/30 to-background">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-primary fill-current" />
                <span className="text-sm font-semibold text-foreground">نظام إدارة متطور</span>
                <Star className="w-4 h-4 text-primary fill-current" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">إصدار 2.0 - 2024</p>
                <p>© جميع الحقوق محفوظة</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}