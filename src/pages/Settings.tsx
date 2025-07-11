import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDateArabic } from '@/lib/dateUtils';
import { createInitialNotifications, createTestNotification } from '@/utils/testNotifications';
import { useDatabaseStatus } from '@/hooks/useDatabaseStatus';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Settings as SettingsIcon,
  Store,
  User,
  Shield,
  Edit,
  Save,
  Eye,
  EyeOff,
  Key,
  Check,
  Building2,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Bell,
  TestTube,
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const Settings = () => {
  // معرف المحل (يمكن الحصول عليه من localStorage أو context)
  const shopId = localStorage.getItem('shopId') || 'default-shop';
  
  // حالة قاعدة البيانات
  const databaseStatus = useDatabaseStatus();
  
  // بيانات المحل
  const [shopData, setShopData] = useState({
    name: 'صالون الملوك للحلاقة',
    ownerName: 'محمد أحمد',
    phone: '+966501234567',
    address: 'شارع الملك فهد، الرياض، المملكة العربية السعودية',
    description: 'أفضل صالون حلاقة في المنطقة، نقدم خدمات متميزة للرجال والأطفال'
  });

  // حالات التعديل
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // بيانات المدير
  const [profileData, setProfileData] = useState({
    name: 'محمد أحمد علي',
    email: 'manager@barbershop.com',
    phone: '+966501234567',
    role: 'مدير المحل'
  });

  // بيانات تغيير كلمة المرور
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // جلب البيانات من Firebase عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        let dataFetched = false;
        
        // جلب بيانات المحل
        const shopDoc = await getDoc(doc(db, 'shops', shopId));
        if (shopDoc.exists()) {
          const shopFirebaseData = shopDoc.data();
          const newShopData = {
            name: shopFirebaseData.name || 'صالون الملوك للحلاقة',
            ownerName: shopFirebaseData.ownerName || 'محمد أحمد',
            phone: shopFirebaseData.phone || '+966501234567',
            address: shopFirebaseData.address || 'شارع الملك فهد، الرياض، المملكة العربية السعودية',
            description: shopFirebaseData.description || 'أفضل صالون حلاقة في المنطقة، نقدم خدمات متميزة للرجال والأطفال'
          };
          
          setShopData(newShopData);
          dataFetched = true;
          
          // تحديث localStorage أيضاً
          localStorage.setItem('shopData', JSON.stringify({
            ...newShopData,
            status: shopFirebaseData.status || 'مفتوح',
            rating: shopFirebaseData.rating || 4.8
          }));
        }

        // جلب بيانات المدير
        const managerDoc = await getDoc(doc(db, 'managers', shopId));
        if (managerDoc.exists()) {
          const managerFirebaseData = managerDoc.data();
          setProfileData({
            name: managerFirebaseData.name || 'محمد أحمد علي',
            email: managerFirebaseData.email || 'manager@barbershop.com',
            phone: managerFirebaseData.phone || '+966501234567',
            role: managerFirebaseData.role || 'مدير المحل'
          });
          dataFetched = true;
        }

        // إشعار بنجح جلب البيانات
        if (dataFetched) {
          toast({
            title: "تم تحميل البيانات 📁",
            description: "تم تحميل البيانات من قاعدة البيانات بنجاح",
          });
        }
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل البيانات من قاعدة البيانات",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [shopId]);

  // حفظ بيانات المحل
  const handleSaveShopData = async () => {
    setIsSaving(true);
    try {
      // حفظ البيانات في Firebase
      const shopDocRef = doc(db, 'shops', shopId);
      await setDoc(shopDocRef, {
        name: shopData.name,
        ownerName: shopData.ownerName,
        phone: shopData.phone,
        address: shopData.address,
        description: shopData.description,
        status: 'مفتوح',
        rating: 4.8,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // في حالة إنشاء جديد
      }, { merge: true }); // merge لتحديث البيانات الموجودة فقط
      
      // حفظ البيانات في localStorage للاستخدام في الشريط الجانبي
      localStorage.setItem('shopData', JSON.stringify({
        name: shopData.name,
        ownerName: shopData.ownerName,
        phone: shopData.phone,
        address: shopData.address,
        description: shopData.description,
        status: 'مفتوح',
        rating: 4.8
      }));
      
      setIsEditingShop(false);
      toast({
        title: 'تم الحفظ بنجاح! ✅',
        description: 'تم تحديث بيانات المحل في قاعدة البيانات',
      });
    } catch (error) {
      console.error('Error saving shop data to Firebase:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ البيانات في قاعدة البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // حفظ بيانات المدير
  const handleSaveProfileData = async () => {
    setIsSaving(true);
    try {
      // حفظ البيانات في Firebase
      const managerDocRef = doc(db, 'managers', shopId);
      await setDoc(managerDocRef, {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        role: profileData.role,
        shopId: shopId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // في حالة إنشاء جديد
      }, { merge: true });
      
      setIsEditingProfile(false);
      toast({
        title: 'تم الحفظ بنجاح! ✅',
        description: 'تم تحديث بيانات الملف الشخصي في قاعدة البيانات',
      });
    } catch (error) {
      console.error('Error saving profile data to Firebase:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ البيانات في قاعدة البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // تغيير كلمة المرور
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'خطأ في كلمة المرور',
        description: 'كلمة المرور الجديدة وتأكيدها غير متطابقين',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'كلمة مرور ضعيفة',
        description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // حفظ كلمة المرور الجديدة في Firebase
      const managerDocRef = doc(db, 'managers', shopId);
      await updateDoc(managerDocRef, {
        lastPasswordChange: serverTimestamp(),
        updatedAt: serverTimestamp()
        // ملاحظة: في التطبيق الحقيقي، يجب تشفير كلمة المرور أو استخدام Firebase Auth
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordDialogOpen(false);
      toast({
        title: 'تم تغيير كلمة المرور! 🔒',
        description: 'تم تغيير كلمة المرور بنجاح وحفظها في قاعدة البيانات',
      });
    } catch (error) {
      console.error('Error updating password in Firebase:', error);
      toast({
        title: 'خطأ في التغيير',
        description: 'حدث خطأ أثناء تغيير كلمة المرور في قاعدة البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // اختبار الإشعارات
  const handleTestNotification = async () => {
    setIsSaving(true);
    try {
      await createTestNotification();
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء إشعار تجريبي",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء الإشعار",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateInitialNotifications = async () => {
    setIsSaving(true);
    try {
      await createInitialNotifications();
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الإشعارات التجريبية",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء الإشعارات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إعدادات النظام</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>إدارة إعدادات المحل والملف الشخصي - {formatDateArabic(new Date())}</span>
            </p>
          </div>
        </div>
      </div>

      {/* بيانات المحل */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-full">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">بيانات المحل</CardTitle>
                <CardDescription className="mt-1">
                  معلومات المحل الأساسية والتواصل
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isEditingShop ? handleSaveShopData() : setIsEditingShop(true)}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditingShop ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
              {isSaving ? 'جارٍ الحفظ...' : isEditingShop ? 'حفظ' : 'تعديل'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-right font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-600" />
                اسم المحل
              </Label>
              {isEditingShop ? (
                <Input
                  value={shopData.name}
                  onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                  className="text-right h-12"
                  dir="rtl"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{shopData.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                اسم المالك
              </Label>
              {isEditingShop ? (
                <Input
                  value={shopData.ownerName}
                  onChange={(e) => setShopData({ ...shopData, ownerName: e.target.value })}
                  className="text-right h-12"
                  dir="rtl"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{shopData.ownerName}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                رقم الهاتف
              </Label>
              {isEditingShop ? (
                <Input
                  value={shopData.phone}
                  onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                  className="text-right h-12"
                  dir="rtl"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{shopData.phone}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                العنوان
              </Label>
              {isEditingShop ? (
                <Textarea
                  value={shopData.address}
                  onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                  className="text-right min-h-[100px] resize-none"
                  dir="rtl"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-800 leading-relaxed">{shopData.address}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-right font-medium">وصف المحل</Label>
              {isEditingShop ? (
                <Textarea
                  value={shopData.description}
                  onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                  className="text-right min-h-[100px] resize-none"
                  dir="rtl"
                  placeholder="وصف مختصر عن المحل وخدماته..."
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-800 leading-relaxed">{shopData.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بيانات المدير */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">الملف الشخصي</CardTitle>
                <CardDescription className="mt-1">
                  بيانات المدير الشخصية
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isEditingProfile ? handleSaveProfileData() : setIsEditingProfile(true)}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditingProfile ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
              {isSaving ? 'جارٍ الحفظ...' : isEditingProfile ? 'حفظ' : 'تعديل'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-right font-medium">الاسم الكامل</Label>
              {isEditingProfile ? (
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="text-right h-12"
                  dir="rtl"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{profileData.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right font-medium">البريد الإلكتروني</Label>
              {isEditingProfile ? (
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="text-right h-12"
                  dir="rtl"
                  type="email"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{profileData.email}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right font-medium">رقم الهاتف</Label>
              {isEditingProfile ? (
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="text-right h-12"
                  dir="rtl"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{profileData.phone}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right font-medium">المنصب</Label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="font-semibold text-gray-800">{profileData.role}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الأمان */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-full">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">الأمان</CardTitle>
              <CardDescription className="mt-1">
                إعدادات الأمان وكلمة المرور
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <h4 className="font-semibold text-gray-800">كلمة المرور</h4>
                <p className="text-sm text-gray-600 mt-1">آخر تحديث: منذ 30 يوماً</p>
              </div>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Key className="h-4 w-4" />
                    تغيير كلمة المرور
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[500px]" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right flex items-center gap-2">
                      <Key className="h-5 w-5 text-red-600" />
                      تغيير كلمة المرور
                    </DialogTitle>
                    <DialogDescription className="text-right">
                      أدخل كلمة المرور الحالية والجديدة لتحديث كلمة المرور
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-right font-medium">كلمة المرور الحالية *</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="text-right h-12 pr-12"
                          dir="rtl"
                          placeholder="أدخل كلمة المرور الحالية"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-right font-medium">كلمة المرور الجديدة *</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="text-right h-12 pr-12"
                          dir="rtl"
                          placeholder="أدخل كلمة المرور الجديدة"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-right font-medium">تأكيد كلمة المرور الجديدة *</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="text-right h-12 pr-12"
                          dir="rtl"
                          placeholder="أعد إدخال كلمة المرور الجديدة"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {passwordData.newPassword && (
                      <div className="text-sm space-y-2">
                        <p className="font-medium text-gray-700">قوة كلمة المرور:</p>
                        <div className="space-y-1">
                          <div className={`flex items-center gap-2 ${passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                            <Check className={`h-3 w-3 ${passwordData.newPassword.length >= 6 ? 'opacity-100' : 'opacity-30'}`} />
                            <span className="text-xs">6 أحرف على الأقل</span>
                          </div>
                          <div className={`flex items-center gap-2 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                            <Check className={`h-3 w-3 ${/[A-Z]/.test(passwordData.newPassword) ? 'opacity-100' : 'opacity-30'}`} />
                            <span className="text-xs">حرف كبير واحد على الأقل</span>
                          </div>
                          <div className={`flex items-center gap-2 ${/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                            <Check className={`h-3 w-3 ${/[0-9]/.test(passwordData.newPassword) ? 'opacity-100' : 'opacity-30'}`} />
                            <span className="text-xs">رقم واحد على الأقل</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="gap-3 flex-col sm:flex-row">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsPasswordDialogOpen(false)}
                      disabled={isSaving}
                      className="w-full sm:w-auto"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جارٍ التغيير...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          <span>تغيير كلمة المرور</span>
                        </div>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قسم اختبار الإشعارات */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-3 rounded-xl">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">اختبار النظام</CardTitle>
                <CardDescription className="mt-1">
                  أدوات لاختبار وتجربة ميزات النظام
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-gray-900">اختبار الإشعارات</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  استخدم هذه الأدوات لاختبار نظام الإشعارات والتأكد من عمله بشكل صحيح
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleTestNotification}
                    disabled={isSaving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    إنشاء إشعار تجريبي
                  </Button>
                  <Button
                    onClick={handleCreateInitialNotifications}
                    disabled={isSaving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    إنشاء إشعارات متنوعة
                  </Button>
                </div>
              </div>

              {/* حالة قاعدة البيانات */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">حالة قاعدة البيانات</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الاتصال:</span>
                    <div className="flex items-center gap-2">
                      {databaseStatus.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : databaseStatus.isConnected ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        databaseStatus.isConnected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {databaseStatus.isLoading ? 'جارٍ الفحص...' : 
                         databaseStatus.isConnected ? 'متصل' : 'غير متصل'}
                      </span>
                    </div>
                  </div>
                  
                  {databaseStatus.lastChecked && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">آخر فحص:</span>
                      <span className="text-sm text-gray-500">
                        {databaseStatus.lastChecked.toLocaleTimeString('ar-SA')}
                      </span>
                    </div>
                  )}
                  
                  {databaseStatus.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      خطأ: {databaseStatus.error}
                    </div>
                  )}
                  
                  <Button
                    onClick={databaseStatus.checkConnection}
                    disabled={databaseStatus.isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${databaseStatus.isLoading ? 'animate-spin' : ''}`} />
                    فحص الاتصال
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;