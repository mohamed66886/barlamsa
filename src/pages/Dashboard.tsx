import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  Banknote,
  TrendingDown,
  Calendar,
  RefreshCw,
  Bell,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const { stats, recentUpdates, loading, error, refetch } = useDashboardData(selectedPeriod);

  // Debug: طباعة البيانات المستلمة
  console.log('📊 Dashboard Stats:', stats);
  console.log('🔔 Recent Updates:', recentUpdates);
  console.log('⏳ Loading:', loading);
  console.log('❌ Error:', error);

  // إحصائيات الواجهة مع البيانات الحقيقية
  const dashboardStats = [
    {
      title: 'الإيراد اليومي',
      value: stats.dailyRevenue.toLocaleString(),
      description: 'ريال سعودي',
      icon: DollarSign,
      trend: '+12%',
      trendType: 'positive' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'إجمالي الكاش',
      value: stats.totalCash.toLocaleString(),
      description: 'نقدي',
      icon: Banknote,
      trend: '+8%',
      trendType: 'positive' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'إجمالي الشبكة',
      value: stats.totalCard.toLocaleString(),
      description: 'بطاقات',
      icon: CreditCard,
      trend: '+18%',
      trendType: 'positive' as const,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'صافي الربح',
      value: stats.netProfit.toLocaleString(),
      description: 'بعد المصروفات',
      icon: TrendingUp,
      trend: '+15%',
      trendType: 'positive' as const,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'المصروفات',
      value: stats.expenses.toLocaleString(),
      description: 'إجمالي',
      icon: TrendingDown,
      trend: '-5%',
      trendType: 'negative' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'عدد الحلاقين',
      value: stats.activeBarbers.toString(),
      description: 'حلاق نشط',
      icon: Users,
      trend: 'مستقر',
      trendType: 'neutral' as const,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hideUnit: true, // لإخفاء وحدة ر.س
    },
  ];

  const getPeriodLabel = (period: string) => {
    const labels = {
      today: 'اليوم',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      custom: 'فترة مخصصة',
    };
    return labels[period as keyof typeof labels] || 'اليوم';
  };

  const getIconForUpdateType = (type: string) => {
    switch (type) {
      case 'appointment':
        return Calendar;
      case 'payment':
        return DollarSign;
      case 'barber':
        return Users;
      case 'expense':
        return TrendingDown;
      default:
        return Activity;
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Data Alert */}
      {!loading && !error && (
        stats.dailyRevenue === 0 && 
        stats.totalCash === 0 && 
        stats.totalCard === 0 && 
        stats.expenses === 0 && 
        stats.activeBarbers === 0
      ) && (
        <Alert className="border-blue-200 bg-blue-50">
          <Activity className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-right">
            <div className="space-y-2">
              <p className="font-medium text-blue-800">
                لا توجد بيانات متاحة للفترة المحددة
              </p>
              <div className="text-sm text-blue-700">
                <p>• تأكد من إضافة حلاقين في قسم "إدارة الحلاقين"</p>
                <p>• ابدأ بتسجيل المبيعات اليومية في قسم "التسجيلات اليومية"</p>
                <p>• أضف المصروفات في قسم "المصروفات"</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/barbers'}>
                  إضافة حلاقين
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/expenses'}>
                  إضافة مصروفات
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">مرحباً بك في نظام إدارة محل الحلاقة</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              )}
              تحديث
            </Button>
            <div className="text-xs text-muted-foreground">
              آخر تحديث: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">الإحصائيات المالية</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-xs self-start sm:self-center">
                {getPeriodLabel(selectedPeriod)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                  {stat.title}
                </CardTitle>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-lg sm:text-xl font-bold ${stat.color} mb-1`}>
                {stat.value}
                {!stat.hideUnit && <span className="text-xs text-muted-foreground mr-1">ر.س</span>}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className={`flex items-center text-xs ${
                  stat.trendType === 'positive' ? 'text-green-600' : 
                  stat.trendType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.trendType === 'positive' && (
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  )}
                  {stat.trendType === 'negative' && (
                    <ArrowDownRight className="h-3 w-3 ml-1" />
                  )}
                  {stat.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Updates */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">آخر التحديثات</CardTitle>
                <CardDescription>أحدث الأنشطة في المحل</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                <Bell className="w-3 h-3 ml-1" />
                عرض الكل
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-3 p-4">
                {recentUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">لا توجد تحديثات حديثة</p>
                  </div>
                ) : (
                  recentUpdates.map((update) => {
                    const IconComponent = getIconForUpdateType(update.type);
                    return (
                      <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <div className="p-2 rounded-full bg-primary/10">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground">{update.title}</p>
                          <p className="text-xs text-muted-foreground">{update.description}</p>
                          <p className="text-xs text-muted-foreground">{update.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملخص سريع</CardTitle>
            <CardDescription>إحصائيات مهمة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">نسبة الكاش</p>
                  <p className="text-xs text-muted-foreground">من إجمالي المبيعات</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {stats.dailyRevenue > 0 
                      ? Math.round((stats.totalCash / stats.dailyRevenue) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">نسبة الشبكة</p>
                  <p className="text-xs text-muted-foreground">من إجمالي المبيعات</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    {stats.dailyRevenue > 0 
                      ? Math.round((stats.totalCard / stats.dailyRevenue) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">هامش الربح</p>
                  <p className="text-xs text-muted-foreground">صافي الربح</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">
                    {stats.dailyRevenue > 0 
                      ? Math.round((stats.netProfit / stats.dailyRevenue) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">حالة النظام</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-muted-foreground">
                    {loading ? 'جاري التحديث...' : error ? 'خطأ في الاتصال' : 'متصل ويعمل بكفاءة'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;