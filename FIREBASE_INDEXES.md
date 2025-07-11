# Firebase Indexes Setup للحلاقين

## الفهارس المطلوبة (اختياري - للأداء الأفضل)

إذا كنت تريد استخدام الترتيب التلقائي في Firebase بدلاً من الترتيب المحلي، يمكنك إنشاء هذه الفهارس:

### 1. فهرس التسجيلات اليومية
- Collection: `dailyRecords`
- Fields: `barberId` (Ascending), `date` (Ascending), `createdAt` (Descending)

### 2. فهرس السلف
- Collection: `advances`  
- Fields: `barberId` (Ascending), `createdAt` (Descending)

## كيفية إنشاء الفهارس:

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك
3. من القائمة الجانبية، اختر **Firestore Database**
4. اذهب إلى تبويب **Indexes**
5. اضغط **Create Index**
6. أدخل بيانات الفهرس كما هو موضح أعلاه

## ملاحظة:
النظام الحالي يعمل بدون هذه الفهارس عن طريق:
- استخدام استعلامات مبسطة بدون `orderBy`
- ترتيب البيانات محلياً في JavaScript
- هذا يوفر مرونة أكبر ويتجنب مشاكل الفهارس

## التحقق من عمل النظام:
1. قم بتسجيل دخول حلاق
2. جرب إضافة تسجيل يومي
3. جرب طلب سلفة
4. تحقق من صفحة البروفايل

إذا واجهت أي أخطاء، تأكد من:
- صحة قواعد Firestore
- اتصال الإنترنت
- صلاحيات المستخدم
