import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { formatDateArabic, formatTime, getTodayString } from '@/lib/dateUtils';
import {
  Plus,
  DollarSign,
  Receipt,
  Trash2,
  Calendar,
  FileText,
  TrendingDown,
  AlertTriangle,
  Loader2,
  Filter,
  Search,
  Edit,
  Tag,
  Clock,
  Eye
} from 'lucide-react';

interface ExpenseType {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

interface ExpenseRecord {
  id: string;
  typeId: string;
  typeName: string;
  amount: number;
  description: string;
  date: string;
  time: string;
  createdAt: Date;
}

const Expenses = () => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExpenseRecord[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingType, setIsAddingType] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  
  // حوارات
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  
  // بيانات النوع الجديد
  const [newType, setNewType] = useState({
    name: '',
    description: ''
  });
  
  // بيانات السند الجديد
  const [newRecord, setNewRecord] = useState({
    typeId: '',
    amount: '',
    description: ''
  });
  
  // فلاتر
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // جلب أنواع المصروفات
  const fetchExpenseTypes = async () => {
    try {
      const typesQuery = query(
        collection(db, 'expenseTypes'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(typesQuery);
      const typesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
      })) as ExpenseType[];
      
      setExpenseTypes(typesData);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      
      // في حالة عدم وجود صلاحيات، نعرض بيانات تجريبية
      if (error && typeof error === 'object' && 'code' in error && 
          (error as { code: string }).code === 'permission-denied') {
        setExpenseTypes([
          {
            id: 'demo-type-1',
            name: 'فواتير الكهرباء والماء',
            description: 'فواتير الخدمات الأساسية للمحل',
            createdAt: new Date(),
          },
          {
            id: 'demo-type-2',
            name: 'مستلزمات التنظيف',
            description: 'منظفات وأدوات النظافة للمحل',
            createdAt: new Date(),
          },
          {
            id: 'demo-type-3',
            name: 'أدوات الحلاقة',
            description: 'مقصات، شفرات، ومعدات الحلاقة',
            createdAt: new Date(),
          },
          {
            id: 'demo-type-4',
            name: 'صيانة المعدات',
            description: 'إصلاح وصيانة المعدات والأجهزة',
            createdAt: new Date(),
          }
        ]);
      }
      
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل أنواع المصروفات',
        variant: 'destructive',
      });
    }
  };

  // جلب سندات الصرف
  const fetchExpenseRecords = async () => {
    try {
      const recordsQuery = query(
        collection(db, 'expenseRecords'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(recordsQuery);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
      })) as ExpenseRecord[];
      
      setExpenseRecords(recordsData);
    } catch (error) {
      console.error('Error fetching expense records:', error);
      
      // في حالة عدم وجود صلاحيات، نعرض بيانات تجريبية
      if (error && typeof error === 'object' && 'code' in error && 
          (error as { code: string }).code === 'permission-denied') {
        setExpenseRecords([
          {
            id: 'demo-record-1',
            typeId: 'demo-type-1',
            typeName: 'فواتير الكهرباء والماء',
            amount: 450,
            description: 'فاتورة كهرباء شهر ديسمبر',
            date: getTodayString(),
            time: formatTime(new Date()),
            createdAt: new Date(),
          },
          {
            id: 'demo-record-2',
            typeId: 'demo-type-2',
            typeName: 'مستلزمات التنظيف',
            amount: 120,
            description: 'شراء منظفات ومواد تنظيف للمحل',
            date: getTodayString(),
            time: formatTime(new Date()),
            createdAt: new Date(),
          }
        ]);
      }
      
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل سندات الصرف',
        variant: 'destructive',
      });
    }
  };

  // جلب جميع البيانات
  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchExpenseTypes(), fetchExpenseRecords()]);
    setIsLoading(false);
  };

  // إضافة نوع مصروف جديد
  const handleAddType = async () => {
    if (!newType.name.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال اسم نوع المصروف',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingType(true);

    try {
      const typeData = {
        name: newType.name.trim(),
        description: newType.description.trim(),
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'expenseTypes'), typeData);
      
      const newTypeWithId = { id: docRef.id, ...typeData };
      setExpenseTypes([newTypeWithId, ...expenseTypes]);
      
      setNewType({ name: '', description: '' });
      setIsTypeDialogOpen(false);
      
      toast({
        title: 'تم إضافة النوع! 📝',
        description: `تم إضافة نوع المصروف "${newType.name}" بنجاح`,
      });

    } catch (error) {
      console.error('Error adding expense type:', error);
      toast({
        title: 'فشل الإضافة',
        description: 'حدث خطأ أثناء إضافة نوع المصروف',
        variant: 'destructive',
      });
    } finally {
      setIsAddingType(false);
    }
  };

  // إضافة سند صرف جديد
  const handleAddRecord = async () => {
    if (!newRecord.typeId || !newRecord.amount || !newRecord.description.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إكمال جميع البيانات المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(newRecord.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'خطأ في المبلغ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingRecord(true);

    try {
      const selectedTypeData = expenseTypes.find(type => type.id === newRecord.typeId);
      const now = new Date();
      
      const recordData = {
        typeId: newRecord.typeId,
        typeName: selectedTypeData?.name || '',
        amount: amount,
        description: newRecord.description.trim(),
        date: getTodayString(),
        time: formatTime(now),
        createdAt: now,
      };

      const docRef = await addDoc(collection(db, 'expenseRecords'), recordData);
      
      const newRecordWithId = { id: docRef.id, ...recordData };
      setExpenseRecords([newRecordWithId, ...expenseRecords]);
      
      setNewRecord({ typeId: '', amount: '', description: '' });
      setIsRecordDialogOpen(false);
      
      toast({
        title: 'تم إضافة السند! 💸',
        description: `تم تسجيل مصروف بقيمة ${amount.toLocaleString()} ر.س`,
      });

    } catch (error) {
      console.error('Error adding expense record:', error);
      toast({
        title: 'فشل الإضافة',
        description: 'حدث خطأ أثناء إضافة سند الصرف',
        variant: 'destructive',
      });
    } finally {
      setIsAddingRecord(false);
    }
  };

  // حذف نوع مصروف
  const handleDeleteType = async (typeId: string, typeName: string) => {
    // التحقق من وجود سندات مرتبطة بهذا النوع
    const relatedRecords = expenseRecords.filter(record => record.typeId === typeId);
    
    if (relatedRecords.length > 0) {
      toast({
        title: 'لا يمكن الحذف',
        description: `يوجد ${relatedRecords.length} سند مرتبط بهذا النوع`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'expenseTypes', typeId));
      setExpenseTypes(expenseTypes.filter(type => type.id !== typeId));
      
      toast({
        title: 'تم الحذف',
        description: `تم حذف نوع المصروف "${typeName}"`,
      });
    } catch (error) {
      console.error('Error deleting expense type:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف النوع',
        variant: 'destructive',
      });
    }
  };

  // حذف سند صرف
  const handleDeleteRecord = async (recordId: string, amount: number) => {
    try {
      await deleteDoc(doc(db, 'expenseRecords', recordId));
      setExpenseRecords(expenseRecords.filter(record => record.id !== recordId));
      
      toast({
        title: 'تم الحذف',
        description: `تم حذف سند الصرف بقيمة ${amount.toLocaleString()} ر.س`,
      });
    } catch (error) {
      console.error('Error deleting expense record:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف السند',
        variant: 'destructive',
      });
    }
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    let filtered = [...expenseRecords];

    // فلتر النوع
    if (selectedType !== 'all') {
      filtered = filtered.filter(record => record.typeId === selectedType);
    }

    // فلتر البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.typeName.toLowerCase().includes(searchLower) ||
        record.description.toLowerCase().includes(searchLower) ||
        record.amount.toString().includes(searchLower)
      );
    }

    // فلتر التاريخ
    if (startDate) {
      filtered = filtered.filter(record => record.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(record => record.date <= endDate);
    }

    setFilteredRecords(filtered);
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseRecords, selectedType, searchTerm, startDate, endDate]);

  // حساب الإحصائيات
  const totalExpenses = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  const todayExpenses = filteredRecords
    .filter(record => record.date === getTodayString())
    .reduce((sum, record) => sum + record.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">جارٍ تحميل المصروفات</h3>
            <p className="text-muted-foreground">يتم تحميل بيانات المصروفات وأنواعها...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-xl shadow-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة المصروفات</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>تتبع وإدارة مصروفات المحل - {formatDateArabic(new Date())}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* زر إضافة نوع مصروف */}
            <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg px-6 py-3 text-base font-medium transform hover:scale-105 transition-all duration-200">
                  <Tag className="h-5 w-5" />
                  إضافة نوع مصروف
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[550px] z-[70] bg-gradient-to-br from-white to-gray-50 border-2 border-blue-100 shadow-2xl" dir="rtl">
                <DialogHeader className="text-center pb-6 border-b border-gray-100">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Tag className="w-8 h-8 text-white" />
                  </div>
                  <DialogTitle className="text-right text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    إضافة نوع مصروف جديد
                  </DialogTitle>
                  <DialogDescription className="text-right text-gray-600 text-lg mt-2">
                    أنشئ تصنيف جديد لتنظيم مصروفات المحل بشكل أفضل
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-8 py-6">
                  {/* اسم النوع */}
                  <div className="grid gap-4">
                    <Label htmlFor="type-name" className="text-right font-bold text-lg text-gray-700 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-blue-600" />
                      اسم نوع المصروف *
                    </Label>
                    <div className="relative">
                      <Tag className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="type-name"
                        value={newType.name}
                        onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                        placeholder="مثال: مستلزمات التنظيف، فواتير الكهرباء، أدوات الحلاقة..."
                        className="text-right text-lg h-14 pr-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-200 bg-white rounded-xl shadow-sm"
                        dir="rtl"
                        disabled={isAddingType}
                        maxLength={100}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        {newType.name.length}/100
                      </div>
                    </div>
                  </div>

                  {/* وصف النوع */}
                  <div className="grid gap-4">
                    <Label htmlFor="type-description" className="text-right font-bold text-lg text-gray-700 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      وصف النوع (اختياري)
                    </Label>
                    <div className="relative">
                      <FileText className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                      <Textarea
                        id="type-description"
                        value={newType.description}
                        onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                        placeholder="وصف تفصيلي لنوع المصروف... هذا سيساعد في تصنيف المصروفات لاحقاً"
                        className="text-right min-h-[100px] resize-none pr-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-200 bg-white rounded-xl shadow-sm"
                        dir="rtl"
                        disabled={isAddingType}
                        maxLength={300}
                      />
                      <div className="absolute left-4 bottom-4 text-xs text-gray-400">
                        {newType.description.length}/300 حرف
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-4 flex-col sm:flex-row pt-6 border-t border-gray-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsTypeDialogOpen(false)}
                    disabled={isAddingType}
                    className="w-full sm:w-auto h-12 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    إلغاء العملية
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleAddType}
                    disabled={isAddingType || !newType.name.trim()}
                    className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 font-bold text-lg"
                  >
                    {isAddingType ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جارٍ إنشاء النوع...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Plus className="w-5 h-5" />
                        <span>إنشاء النوع</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* زر إضافة سند صرف */}
            <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg px-6 py-3 text-base font-medium transform hover:scale-105 transition-all duration-200">
                  <Plus className="h-5 w-5" />
                  إضافة سند صرف
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 border-2 border-red-100 shadow-2xl" dir="rtl">
                <DialogHeader className="text-center pb-6 border-b border-gray-100">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Receipt className="w-8 h-8 text-white" />
                  </div>
                  <DialogTitle className="text-right text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    إضافة سند صرف جديد
                  </DialogTitle>
                  <DialogDescription className="text-right text-gray-600 text-lg mt-2">
                    سجل مصروف جديد مع تحديد النوع والمبلغ والوصف التفصيلي
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-8 py-6">
                  {/* نوع المصروف */}
                  <div className="grid gap-4">
                    <Label htmlFor="record-type" className="text-right font-bold text-lg text-gray-700 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-red-600" />
                      نوع المصروف *
                    </Label>
                    <Select
                      value={newRecord.typeId}
                      onValueChange={(value) => setNewRecord({ ...newRecord, typeId: value })}
                      disabled={isAddingRecord}
                    >
                      <SelectTrigger className="w-full h-14 text-lg border-2 border-gray-200 hover:border-red-300 focus:border-red-500 transition-all duration-200 bg-white rounded-xl shadow-sm text-right" dir="rtl">
                        <SelectValue placeholder="اختر نوع المصروف من القائمة" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom"
                        align="center"
                        sideOffset={4}
                        className="w-full min-w-[var(--radix-select-trigger-width)] bg-white border border-gray-200 shadow-xl rounded-lg max-h-[300px] overflow-y-auto z-[80]"
                      >
                        {expenseTypes.length === 0 ? (
                          <SelectItem value="none" disabled className="text-gray-500 text-center py-4">
                            <div className="flex items-center gap-2 justify-center">
                              <AlertTriangle className="w-4 h-4" />
                              لا توجد أنواع مصروفات - أضف نوع أولاً
                            </div>
                          </SelectItem>
                        ) : (
                          expenseTypes.map(type => (
                            <SelectItem 
                              key={type.id} 
                              value={type.id} 
                              className="text-right py-3 px-4 hover:bg-red-50 focus:bg-red-50 transition-colors duration-200 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="p-1 bg-red-100 rounded-full flex-shrink-0">
                                  <Tag className="w-3 h-3 text-red-600" />
                                </div>
                                <div className="text-right flex-1">
                                  <div className="font-semibold text-gray-800">{type.name}</div>
                                  {type.description && (
                                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {expenseTypes.length === 0 && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <AlertDescription className="text-right text-orange-800">
                          <div className="font-medium">يجب إضافة نوع مصروف أولاً!</div>
                          <div className="text-sm mt-1">اضغط على "إضافة نوع مصروف" لإنشاء نوع جديد.</div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* المبلغ */}
                  <div className="grid gap-4">
                    <Label htmlFor="record-amount" className="text-right font-bold text-lg text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-red-600" />
                      المبلغ (ريال سعودي) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="record-amount"
                        type="number"
                        value={newRecord.amount}
                        onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                        placeholder="0.00"
                        className="text-right text-xl h-14 pr-12 border-2 border-gray-200 hover:border-red-300 focus:border-red-500 transition-all duration-200 bg-white rounded-xl shadow-sm font-semibold"
                        dir="rtl"
                        disabled={isAddingRecord}
                        min="0"
                        step="0.01"
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                        ر.س
                      </div>
                    </div>
                    {newRecord.amount && !isNaN(parseFloat(newRecord.amount)) && (
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-700 font-medium">
                          المبلغ بالكلمات: {parseFloat(newRecord.amount).toLocaleString()} ريال سعودي
                        </p>
                      </div>
                    )}
                  </div>

                  {/* الوصف */}
                  <div className="grid gap-4">
                    <Label htmlFor="record-description" className="text-right font-bold text-lg text-gray-700 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-600" />
                      وصف المصروف *
                    </Label>
                    <div className="relative">
                      <FileText className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                      <Textarea
                        id="record-description"
                        value={newRecord.description}
                        onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                        placeholder="أدخل وصف تفصيلي للمصروف... مثال: فاتورة كهرباء شهر يناير، أو شراء مستلزمات تنظيف، أو صيانة المعدات، إلخ."
                        className="text-right min-h-[120px] resize-none pr-12 border-2 border-gray-200 hover:border-red-300 focus:border-red-500 transition-all duration-200 bg-white rounded-xl shadow-sm text-base leading-relaxed"
                        dir="rtl"
                        disabled={isAddingRecord}
                        maxLength={500}
                      />
                      <div className="absolute left-4 bottom-4 text-xs text-gray-400">
                        {newRecord.description.length}/500 حرف
                      </div>
                    </div>
                  </div>

                  {/* معاينة السند */}
                  {newRecord.typeId && newRecord.amount && newRecord.description && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                      <h4 className="font-bold text-lg text-red-800 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        معاينة السند
                      </h4>
                      <div className="grid gap-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">النوع:</span>
                          <span className="font-bold text-gray-800">
                            {expenseTypes.find(t => t.id === newRecord.typeId)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">المبلغ:</span>
                          <span className="font-bold text-red-600 text-lg">
                            {parseFloat(newRecord.amount).toLocaleString()} ر.س
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">التاريخ:</span>
                          <span className="font-bold text-gray-800">
                            {formatDateArabic(new Date())}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-gray-600">الوصف:</span>
                          <span className="font-medium text-gray-800 text-right max-w-[60%]">
                            {newRecord.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-4 flex-col sm:flex-row pt-6 border-t border-gray-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRecordDialogOpen(false)}
                    disabled={isAddingRecord}
                    className="w-full sm:w-auto h-12 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    إلغاء العملية
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleAddRecord}
                    disabled={isAddingRecord || !newRecord.typeId || !newRecord.amount || !newRecord.description.trim() || expenseTypes.length === 0}
                    className="w-full sm:w-auto h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 font-bold text-lg"
                  >
                    {isAddingRecord ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جارٍ حفظ السند...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Plus className="w-5 h-5" />
                        <span>حفظ سند الصرف</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">إجمالي المصروفات</p>
                <p className="text-3xl font-bold text-red-700">{totalExpenses.toLocaleString()}</p>
                <p className="text-sm text-red-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full shadow-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">مصروفات اليوم</p>
                <p className="text-3xl font-bold text-orange-700">{todayExpenses.toLocaleString()}</p>
                <p className="text-sm text-orange-600">ريال سعودي</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">أنواع المصروفات</p>
                <p className="text-3xl font-bold text-blue-700">{expenseTypes.length}</p>
                <p className="text-sm text-blue-600">نوع</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                <Tag className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">عدد السندات</p>
                <p className="text-3xl font-bold text-purple-700">{filteredRecords.length}</p>
                <p className="text-sm text-purple-600">سند</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر البحث */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-red-600" />
            فلاتر البحث والتصفية
          </CardTitle>
          <CardDescription>
            استخدم الفلاتر للبحث في سندات الصرف
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-right font-medium">البحث</Label>
              <div className="relative mt-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في الوصف أو النوع..."
                  className="pr-10 text-right"
                  dir="rtl"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-right font-medium">نوع المصروف</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="text-right mt-1" dir="rtl">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent 
                  position="popper"
                  side="bottom"
                  align="center"
                  sideOffset={4}
                  className="w-full min-w-[var(--radix-select-trigger-width)] bg-white border border-gray-200 shadow-lg rounded-lg z-50"
                >
                  <SelectItem value="all" className="text-right">جميع الأنواع</SelectItem>
                  {expenseTypes.map(type => (
                    <SelectItem key={type.id} value={type.id} className="text-right">
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
          </div>
        </CardContent>
      </Card>

      {/* قائمة أنواع المصروفات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            أنواع المصروفات ({expenseTypes.length})
          </CardTitle>
          <CardDescription>
            إدارة أنواع المصروفات المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {expenseTypes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">لا توجد أنواع مصروفات</h3>
              <p className="text-muted-foreground mb-6">ابدأ بإضافة نوع مصروف جديد</p>
              <Button 
                onClick={() => setIsTypeDialogOpen(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                إضافة نوع جديد
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {expenseTypes.map((type) => {
                const relatedRecords = expenseRecords.filter(record => record.typeId === type.id);
                const typeTotal = relatedRecords.reduce((sum, record) => sum + record.amount, 0);
                
                return (
                  <div key={type.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-blue-900">{type.name}</h4>
                        {type.description && (
                          <p className="text-sm text-blue-700 mt-1">{type.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteType(type.id, type.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={relatedRecords.length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">إجمالي المصروفات</p>
                        <p className="font-bold text-xl text-blue-900">{typeTotal.toLocaleString()}</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {relatedRecords.length} سند
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* سندات الصرف */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-600" />
            سندات الصرف ({filteredRecords.length})
          </CardTitle>
          <CardDescription>
            جميع سندات الصرف المسجلة - إجمالي المبلغ: {totalExpenses.toLocaleString()} ر.س
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Receipt className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">لا توجد سندات صرف</h3>
              <p className="text-muted-foreground mb-6">
                {expenseTypes.length === 0 
                  ? 'أضف نوع مصروف أولاً ثم ابدأ بتسجيل المصروفات'
                  : 'ابدأ بإضافة سند صرف جديد'
                }
              </p>
              {expenseTypes.length > 0 && (
                <Button 
                  onClick={() => setIsRecordDialogOpen(true)}
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  إضافة سند جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRecords.map((record, index) => (
                <div key={record.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{record.amount.toLocaleString()}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm font-medium" variant="outline">
                                <div className="flex items-center gap-2">
                                  <Tag className="w-4 h-4" />
                                  <span>{record.typeName}</span>
                                </div>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDateArabic(record.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{record.time}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            وصف المصروف:
                          </p>
                          <p className="text-sm text-gray-800 leading-relaxed">{record.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            سند #{filteredRecords.length - index} - ريال سعودي
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRecord(record.id, record.amount)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
};

export default Expenses;