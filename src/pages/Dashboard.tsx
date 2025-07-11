import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'إجمالي الحلاقين',
      value: '8',
      description: 'حلاق نشط',
      icon: Users,
      trend: '+2',
      trendType: 'positive' as const,
    },
    {
      title: 'إيرادات اليوم',
      value: '1,250',
      description: 'ريال سعودي',
      icon: DollarSign,
      trend: '+15%',
      trendType: 'positive' as const,
    },
    {
      title: 'مواعيد اليوم',
      value: '24',
      description: 'موعد محجوز',
      icon: Calendar,
      trend: '-3',
      trendType: 'negative' as const,
    },
    {
      title: 'متوسط وقت الخدمة',
      value: '35',
      description: 'دقيقة',
      icon: Clock,
      trend: '-5 دقائق',
      trendType: 'positive' as const,
    },
  ];

  const recentAppointments = [
    {
      id: 1,
      customer: 'محمد أحمد',
      barber: 'خالد العلي',
      service: 'حلاقة + حجامة',
      time: '10:30 ص',
      status: 'في الانتظار',
      price: 75,
    },
    {
      id: 2,
      customer: 'عبدالله سالم',
      barber: 'أحمد حسن',
      service: 'حلاقة عادية',
      time: '11:00 ص',
      status: 'جاري التنفيذ',
      price: 45,
    },
    {
      id: 3,
      customer: 'فهد الغامدي',
      barber: 'سعود المطيري',
      service: 'تشذيب لحية',
      time: '11:30 ص',
      status: 'مكتمل',
      price: 30,
    },
  ];

  const topBarbers = [
    {
      name: 'خالد العلي',
      appointments: 12,
      revenue: 540,
      rating: 4.9,
    },
    {
      name: 'أحمد حسن',
      appointments: 10,
      revenue: 450,
      rating: 4.8,
    },
    {
      name: 'سعود المطيري',
      appointments: 8,
      revenue: 360,
      rating: 4.7,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'في الانتظار':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'جاري التنفيذ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'مكتمل':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك في نظام إدارة محل الحلاقة</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>اليوم: {new Date().toLocaleDateString('ar-SA')}</p>
          <p>الوقت: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className={`flex items-center text-xs ${
                  stat.trendType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trendType === 'positive' ? (
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 ml-1" />
                  )}
                  {stat.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>المواعيد الحديثة</CardTitle>
                <CardDescription>آخر المواعيد المحجوزة اليوم</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                عرض الكل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{appointment.customer}</p>
                        <p className="text-sm text-muted-foreground">الحلاق: {appointment.barber}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{appointment.service}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{appointment.time}</p>
                    <Badge className={getStatusColor(appointment.status)} variant="secondary">
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-primary">{appointment.price} ر.س</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Barbers */}
        <Card>
          <CardHeader>
            <CardTitle>أفضل الحلاقين</CardTitle>
            <CardDescription>الأعلى أداءً اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBarbers.map((barber, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {barber.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{barber.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{barber.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-primary">{barber.revenue} ر.س</p>
                    <p className="text-xs text-muted-foreground">{barber.appointments} موعد</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;