import { useState } from 'react';
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
import {
  Home,
  Users,
  TrendingUp,
  DollarSign,
  Receipt,
  Settings,
  Scissors,
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

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
      : 'hover:bg-accent hover:text-accent-foreground';

  return (
    <Sidebar side="right" className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent className="bg-card border-l border-border">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="text-right">
                <h2 className="text-lg font-bold text-foreground">محل الحلاقة</h2>
                <p className="text-xs text-muted-foreground">نظام الإدارة</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-right px-4 py-2 text-muted-foreground text-sm font-medium">
            {!collapsed && 'القائمة الرئيسية'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors ${getNavClass({ isActive })}`
                      }
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                      {!collapsed && (
                        <span className="text-right flex-1">{item.title}</span>
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
          <div className="mt-auto p-4 border-t border-border">
            <div className="text-center text-xs text-muted-foreground">
              <p>إصدار 1.0</p>
              <p>© 2024 جميع الحقوق محفوظة</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}