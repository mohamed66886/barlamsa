import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateArabic, formatDate } from '@/lib/dateUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Award,
  Target,
  Filter,
  Download,
  Scissors,
  CreditCard,
  Banknote,
  ChartBar,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Barber {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
}

interface DailyRecord {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  date: string;
  time: string;
  createdAt: Date;
}

interface Advance {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface BarberPerformance {
  barberId: string;
  barberName: string;
  avatar: string;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  totalAdvances: number;
  transactionCount: number;
  averagePerTransaction: number;
  outstandingBalance: number; // الرصيد المستحق
  rank: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Performance = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [performance, setPerformance] = useState<BarberPerformance[]>([]);
  const [filteredData, setFilteredData] = useState<BarberPerformance[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // فلاتر
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');

  // جلب جميع البيانات
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // جلب بيانات الحلاقين
      const barbersSnapshot = await getDocs(collection(db, 'barbers'));
      const barbersData = barbersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Barber[];
      setBarbers(barbersData);

      // جلب جميع التسجيلات اليومية
      const recordsSnapshot = await getDocs(collection(db, 'dailyRecords'));
      const recordsData = recordsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        };
      }) as DailyRecord[];
      setDailyRecords(recordsData);

      // جلب جميع السلف
      const advancesSnapshot = await getDocs(collection(db, 'advances'));
      const advancesData = advancesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advance[];
      setAdvances(advancesData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // حساب أداء الحلاقين
  const calculatePerformance = () => {
    const performanceMap = new Map<string, BarberPerformance>();

    // تهيئة بيانات الحلاقين
    barbers.forEach(barber => {
      performanceMap.set(barber.id, {
        barberId: barber.id,
        barberName: barber.name,
        avatar: barber.avatar,
        totalRevenue: 0,
        totalCash: 0,
        totalCard: 0,
        totalAdvances: 0,
        transactionCount: 0,
        averagePerTransaction: 0,
        outstandingBalance: 0,
        rank: 0
      });
    });

    // فلترة البيانات حسب الفترة المحددة
    const filteredRecords = filterDataByPeriod(dailyRecords);
    const filteredAdvances = filterDataByPeriod(advances);

    // حساب الإيرادات من التسجيلات اليومية
    filteredRecords.forEach(record => {
      const performance = performanceMap.get(record.barberId);
      if (performance) {
        performance.totalRevenue += record.amount;
        performance.transactionCount += 1;
        
        if ((record as DailyRecord).paymentMethod === 'cash') {
          performance.totalCash += record.amount;
        } else if ((record as DailyRecord).paymentMethod === 'card') {
          performance.totalCard += record.amount;
        }
      }
    });

    // حساب السلف المعتمدة
    filteredAdvances.forEach(advance => {
      if ((advance as Advance).status === 'approved') {
        const performance = performanceMap.get(advance.barberId);
        if (performance) {
          performance.totalAdvances += advance.amount;
        }
      }
    });

    // حساب المتوسط لكل معاملة والرصيد المستحق وترتيب النتائج
    const performanceArray = Array.from(performanceMap.values())
      .map(perf => ({
        ...perf,
        averagePerTransaction: perf.transactionCount > 0 ? perf.totalRevenue / perf.transactionCount : 0,
        outstandingBalance: perf.totalRevenue - perf.totalAdvances // الرصيد المستحق = الإيرادات - السلف
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((perf, index) => ({ ...perf, rank: index + 1 }));

    setPerformance(performanceArray);
  };

  // فلترة البيانات حسب الفترة
  const filterDataByPeriod = (data: (DailyRecord | Advance)[]) => {
    const now = new Date();
    let startDateFilter = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (startDate && endDate) {
          return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
          });
        }
        return data;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDateFilter;
    });
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    let filtered = [...performance];

    if (selectedBarber !== 'all') {
      filtered = filtered.filter(perf => perf.barberId === selectedBarber);
    }

    setFilteredData(filtered);
  };

  // تحديث البيانات
  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (barbers.length > 0) {
      calculatePerformance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbers, dailyRecords, advances, selectedPeriod, startDate, endDate]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performance, selectedBarber]);

  // إعداد بيانات الرسوم البيانية
  const chartData = filteredData.map(perf => ({
    name: perf.barberName.split(' ')[0], // الاسم الأول فقط
    revenue: perf.totalRevenue,
    cash: perf.totalCash,
    card: perf.totalCard,
    transactions: perf.transactionCount
  }));

  const pieData = filteredData.map((perf, index) => ({
    name: perf.barberName,
    value: perf.totalRevenue,
    color: COLORS[index % COLORS.length]
  }));

  // حساب الإحصائيات العامة
  const totalRevenue = filteredData.reduce((sum, perf) => sum + perf.totalRevenue, 0);
  const totalTransactions = filteredData.reduce((sum, perf) => sum + perf.transactionCount, 0);
  const totalOutstandingBalance = filteredData.reduce((sum, perf) => sum + perf.outstandingBalance, 0);
  const averageRevenuePerBarber = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
  const topPerformer = filteredData[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">جارٍ تحميل بيانات الأداء</h3>
            <p className="text-muted-foreground">يتم تحليل وحساب إحصائيات الحلاقين...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <ChartBar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">تتبع الأداء</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>تقارير وإحصائيات مفصلة - {formatDateArabic(new Date())}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-purple-600" />
            فلاتر التقرير
          </CardTitle>
          <CardDescription>
            اختر الفترة الزمنية والحلاق لعرض البيانات المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* فلتر الفترة */}
            <div>
              <Label className="text-right font-medium mb-2 block">الفترة الزمنية</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* فلتر الحلاق */}
            <div>
              <Label className="text-right font-medium mb-2 block">الحلاق</Label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="جميع الحلاقين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحلاقين</SelectItem>
                  {barbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تاريخ البداية - يظهر عند اختيار فترة مخصصة */}
            {selectedPeriod === 'custom' && (
              <div>
                <Label className="text-right font-medium mb-2 block">من تاريخ</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-right"
                />
              </div>
            )}

            {/* تاريخ النهاية - يظهر عند اختيار فترة مخصصة */}
            {selectedPeriod === 'custom' && (
              <div>
                <Label className="text-right font-medium mb-2 block">إلى تاريخ</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-right"
                />
              </div>
            )}

            {/* نوع الرسم البياني */}
            <div className={selectedPeriod === 'custom' ? 'sm:col-span-2 lg:col-span-1' : ''}>
              <Label className="text-right font-medium mb-2 block">نوع الرسم</Label>
              <Select value={chartType} onValueChange={(value: 'bar' | 'pie' | 'line') => setChartType(value)}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart className="w-4 h-4" />
                      <span>رسم بياني عمودي</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4" />
                      <span>رسم دائري</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-4 h-4" />
                      <span>رسم خطي</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات عامة */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-green-700">{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">إجمالي المعاملات</p>
                <p className="text-3xl font-bold text-blue-700">{totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-blue-600">معاملة</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">إجمالي الرصيد المستحق</p>
                <p className={`text-3xl font-bold ${totalOutstandingBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {totalOutstandingBalance.toLocaleString()}
                </p>
                <p className={`text-sm ${totalOutstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                  {totalOutstandingBalance >= 0 ? 'مستحق للحلاقين' : 'مديونية على الحلاقين'}
                </p>
              </div>
              <div className={`p-3 rounded-full shadow-lg ${totalOutstandingBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">أفضل حلاق</p>
                <p className="text-lg font-bold text-orange-700">{topPerformer?.barberName || 'لا يوجد'}</p>
                <p className="text-sm text-orange-600">{topPerformer?.totalRevenue.toLocaleString() || 0} ر.س</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* الرسم البياني الأساسي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {chartType === 'bar' && <BarChart className="w-5 h-5 text-purple-600" />}
              {chartType === 'pie' && <PieChartIcon className="w-5 h-5 text-purple-600" />}
              {chartType === 'line' && <LineChartIcon className="w-5 h-5 text-purple-600" />}
              إيرادات الحلاقين
            </CardTitle>
            <CardDescription>
              توزيع الإيرادات حسب الحلاقين للفترة المحددة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيراد']}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" />
                  </BarChart>
                ) : chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} ر.س`} />
                  </PieChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيراد']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* توزيع طرق الدفع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              توزيع طرق الدفع
            </CardTitle>
            <CardDescription>
              نسبة المدفوعات النقدية مقابل الشبكة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} ر.س`, 
                      name === 'cash' ? 'نقداً' : 'شبكة'
                    ]}
                  />
                  <Bar dataKey="cash" fill="#10b981" name="cash" />
                  <Bar dataKey="card" fill="#3b82f6" name="card" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول أداء الحلاقين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            تفاصيل أداء الحلاقين
            <Badge variant="secondary" className="mr-2">
              {filteredData.length} حلاق
            </Badge>
          </CardTitle>
          <CardDescription>
            ترتيب الحلاقين حسب الأداء - الرصيد المستحق = الإيرادات - السلف المعتمدة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">لا توجد بيانات</h3>
              <p className="text-muted-foreground mb-6">لا توجد بيانات أداء للفترة المحددة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredData.map((barber, index) => (
                <div key={barber.barberId} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                          <AvatarImage src={barber.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-lg font-bold">
                            {barber.barberName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {barber.rank}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{barber.barberName}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge 
                                className={`
                                  ${barber.rank === 1 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    barber.rank === 2 ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                    barber.rank === 3 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-blue-100 text-blue-800 border-blue-200'
                                  } px-3 py-1 text-sm font-medium
                                `}
                                variant="outline"
                              >
                                <div className="flex items-center gap-2">
                                  {barber.rank === 1 ? <Award className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                                  <span>المركز #{barber.rank}</span>
                                </div>
                              </Badge>
                              <span className="text-sm text-gray-500">{barber.transactionCount} معاملة</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-3xl text-gray-900">{barber.totalRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">ريال سعودي</p>
                          </div>
                        </div>
                        
                        {/* تفاصيل إضافية */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Banknote className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-600">نقداً</span>
                            </div>
                            <p className="font-bold text-green-700">{barber.totalCash.toLocaleString()}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-600">شبكة</span>
                            </div>
                            <p className="font-bold text-blue-700">{barber.totalCard.toLocaleString()}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-gray-600">السلف</span>
                            </div>
                            <p className="font-bold text-purple-700">{barber.totalAdvances.toLocaleString()}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <TrendingUp className={`w-4 h-4 ${barber.outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                              <span className="text-sm font-medium text-gray-600">الرصيد المستحق</span>
                            </div>
                            <p className={`font-bold ${barber.outstandingBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {barber.outstandingBalance.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {barber.outstandingBalance >= 0 ? 'مستحق للحلاق' : 'عليه مديونية'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* رسم بياني للاتجاهات اليومية */}
      {selectedPeriod !== 'today' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              اتجاه الأداء
            </CardTitle>
            <CardDescription>
              تطور الإيرادات خلال الفترة المحددة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيراد']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Performance;