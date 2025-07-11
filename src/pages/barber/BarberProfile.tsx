import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDateArabic, formatDate } from '@/lib/dateUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  FileText,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface BarberData {
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
  reason: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const BarberProfile = () => {
  const [currentBarber, setCurrentBarber] = useState<BarberData | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [filteredAdvances, setFilteredAdvances] = useState<Advance[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // إحصائيات
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [approvedAdvances, setApprovedAdvances] = useState(0);
  const [pendingAdvances, setPendingAdvances] = useState(0);

  const fetchAllData = async (barberId: string) => {
    try {
      setIsLoading(true);
      
      // جلب التسجيلات اليومية
      const recordsQuery = query(
        collection(db, 'dailyRecords'),
        where('barberId', '==', barberId)
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      const recordsData = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyRecord[];
      
      // ترتيب البيانات محلياً حسب وقت الإنشاء
      recordsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setDailyRecords(recordsData);
      
      // جلب السلف
      const advancesQuery = query(
        collection(db, 'advances'),
        where('barberId', '==', barberId)
      );
      
      const advancesSnapshot = await getDocs(advancesQuery);
      const advancesData = advancesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advance[];
      
      // ترتيب البيانات محلياً حسب وقت الإنشاء
      advancesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAdvances(advancesData);
      
      // حساب الإحصائيات
      calculateStats(recordsData, advancesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredRecordsData = [...dailyRecords];
    let filteredAdvancesData = [...advances];
    
    // تطبيق فلتر التاريخ
    if (startDate) {
      filteredRecordsData = filteredRecordsData.filter(record => record.date >= startDate);
      filteredAdvancesData = filteredAdvancesData.filter(advance => advance.date >= startDate);
    }
    
    if (endDate) {
      filteredRecordsData = filteredRecordsData.filter(record => record.date <= endDate);
      filteredAdvancesData = filteredAdvancesData.filter(advance => advance.date <= endDate);
    }
    
    // تطبيق فلتر البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredRecordsData = filteredRecordsData.filter(record => 
        record.paymentMethod.toLowerCase().includes(searchLower) ||
        record.amount.toString().includes(searchLower) ||
        record.date.includes(searchLower)
      );
      filteredAdvancesData = filteredAdvancesData.filter(advance => 
        advance.reason.toLowerCase().includes(searchLower) ||
        advance.amount.toString().includes(searchLower) ||
        advance.status.toLowerCase().includes(searchLower) ||
        advance.date.includes(searchLower)
      );
    }
    
    setFilteredRecords(filteredRecordsData);
    setFilteredAdvances(filteredAdvancesData);
  };

  useEffect(() => {
    // الحصول على بيانات الحلاق
    const barberData = localStorage.getItem('currentBarber');
    if (barberData) {
      const barber = JSON.parse(barberData);
      setCurrentBarber(barber);
      fetchAllData(barber.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // تطبيق الفلاتر
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyRecords, advances, startDate, endDate, searchTerm]);

  const calculateStats = (records: DailyRecord[], advances: Advance[]) => {
    // إحصائيات التسجيلات اليومية
    const total = records.reduce((sum, record) => sum + record.amount, 0);
    const cash = records.filter(r => r.paymentMethod === 'cash').reduce((sum, record) => sum + record.amount, 0);
    const card = records.filter(r => r.paymentMethod === 'card').reduce((sum, record) => sum + record.amount, 0);
    
    setTotalEarnings(total);
    setTotalCash(cash);
    setTotalCard(card);
    
    // إحصائيات السلف
    const totalAdvancesAmount = advances.reduce((sum, advance) => sum + advance.amount, 0);
    const approved = advances.filter(a => a.status === 'approved').reduce((sum, advance) => sum + advance.amount, 0);
    const pending = advances.filter(a => a.status === 'pending').reduce((sum, advance) => sum + advance.amount, 0);
    
    setTotalAdvances(totalAdvancesAmount);
    setApprovedAdvances(approved);
    setPendingAdvances(pending);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />معتمدة</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />مرفوضة</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="h-3 w-3 mr-1" />معلقة</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    return method === 'cash' ? (
      <Badge variant="outline" className="text-green-600 border-green-200">
        <Banknote className="h-3 w-3 mr-1" />
        كاش
      </Badge>
    ) : (
      <Badge variant="outline" className="text-blue-600 border-blue-200">
        <CreditCard className="h-3 w-3 mr-1" />
        شبكة
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">جارٍ تحميل بيانات الملف الشخصي...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentBarber) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">الملف الشخصي</h1>
              <p className="text-gray-600 mt-1">عرض بياناتك وجميع تسجيلاتك وإحصائياتك</p>
            </div>
          </div>
        </div>
      </div>

      {/* معلومات الحلاق */}
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-xl">
              <AvatarImage src={currentBarber.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                {currentBarber.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-right flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{currentBarber.name}</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 text-gray-600">
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{currentBarber.email}</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">انضم في {formatDateArabic(currentBarber.joinDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-green-500 rounded-full shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-700">{totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-green-600 font-medium">إجمالي الأرباح</p>
            <p className="text-xs text-green-500">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-emerald-500 rounded-full shadow-lg">
                <Banknote className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{totalCash.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 font-medium">كاش</p>
            <p className="text-xs text-emerald-500">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-blue-500 rounded-full shadow-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalCard.toLocaleString()}</p>
            <p className="text-xs text-blue-600 font-medium">شبكة</p>
            <p className="text-xs text-blue-500">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-orange-500 rounded-full shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-700">{totalAdvances.toLocaleString()}</p>
            <p className="text-xs text-orange-600 font-medium">إجمالي السلف</p>
            <p className="text-xs text-orange-500">ريال سعودي</p>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر البحث */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            فلاتر البحث والتصفية
          </CardTitle>
          <CardDescription>
            استخدم الفلاتر لتصفية التسجيلات والسلف حسب التاريخ أو النص
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-right font-medium">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-right mt-1"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label htmlFor="end-date" className="text-right font-medium">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-right mt-1"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label htmlFor="search" className="text-right font-medium">البحث</Label>
              <div className="relative mt-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في التسجيلات..."
                  className="pr-10 text-right"
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full mt-1 border-gray-300 hover:bg-gray-50"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التسجيلات اليومية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            التسجيلات اليومية ({filteredRecords.length})
          </CardTitle>
          <CardDescription>
            جميع تسجيلاتك اليومية مرتبة حسب التاريخ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تسجيلات تطابق المعايير المحددة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-foreground">{record.amount.toLocaleString()} ر.س</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentMethodBadge(record.paymentMethod)}
                        <span className="text-xs text-muted-foreground">{record.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">{formatDate(record.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* السلف */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            السلف ({filteredAdvances.length})
          </CardTitle>
          <CardDescription>
            جميع طلبات السلف الخاصة بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAdvances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سلف تطابق المعايير المحددة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdvances.map((advance) => (
                <div key={advance.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{advance.amount.toLocaleString()} ر.س</p>
                      <p className="text-sm text-muted-foreground mt-1">{advance.reason}</p>
                    </div>
                    <div className="text-left">
                      {getStatusBadge(advance.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(advance.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberProfile;
