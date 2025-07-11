# إعداد قواعد Firebase للمشروع

## 🔥 خطوات إعداد Firebase Firestore

### 1. الوصول إلى Firebase Console
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروع `lomsaa-330fc`

### 2. إعداد قواعد Firestore
1. في الشريط الجانبي، اضغط على **Firestore Database**
2. اذهب إلى تبويب **Rules**
3. استبدل القواعد الموجودة بالقواعد التالية:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قواعد للحلاقين - يمكن للمستخدمين المصادق عليهم القراءة والكتابة
    match /barbers/{barberId} {
      allow read, write: if request.auth != null;
    }
    
    // قواعد للمواعيد - يمكن للمستخدمين المصادق عليهم القراءة والكتابة
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    
    // قواعد للمصروفات - يمكن للمستخدمين المصادق عليهم القراءة والكتابة
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null;
    }
    
    // قواعد للتقدمات - يمكن للمستخدمين المصادق عليهم القراءة والكتابة
    match /advances/{advanceId} {
      allow read, write: if request.auth != null;
    }
    
    // قواعد عامة - أي مجموعة أخرى
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. إعداد قواعد Firebase Authentication
1. في الشريط الجانبي، اضغط على **Authentication**
2. اذهب إلى تبويب **Settings**
3. تأكد من تفعيل **Email/Password** في طرق تسجيل الدخول

### 4. إنشاء مستخدم إداري أول
1. في تبويب **Users** في Authentication
2. اضغط **Add user**
3. أدخل:
   - البريد الإلكتروني: `admin@lamsa-ibda3iya.com`
   - كلمة المرور: `admin123456`

### 5. اختبار النظام
1. سجل دخول بالبريد الإلكتروني وكلمة المرور المنشأة
2. جرب إضافة حلاق جديد
3. تأكد من ظهور البيانات في Firestore

## 🔒 قواعد أمان متقدمة (اختيارية)

للحصول على أمان أكبر، يمكنك استخدام هذه القواعد:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قواعد للحلاقين - فقط الإداريين يمكنهم الإضافة/التعديل
    match /barbers/{barberId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // قواعد للمستخدمين
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // المواعيد - الحلاق يمكنه رؤية مواعيده فقط
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && 
        (resource.data.barberId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // المصروفات والتقدمات - فقط الإداريين
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /advances/{advanceId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🚨 استكشاف الأخطاء

### خطأ "Missing or insufficient permissions"
- تأكد من أنك مسجل دخول في التطبيق
- تحقق من قواعد Firestore في Firebase Console
- تأكد من أن المستخدم له صلاحيات القراءة/الكتابة

### خطأ "FirebaseError: Permission denied"
- تحقق من أن مشروع Firebase مُفعل
- تأكد من صحة إعدادات Firebase في ملف `src/lib/firebase.ts`
- تحقق من أن Firestore Database مُنشأ ومُفعل

### خطأ في تسجيل الدخول
- تأكد من تفعيل Email/Password في Authentication
- تحقق من صحة البريد الإلكتروني وكلمة المرور
- تأكد من أن المستخدم موجود في قائمة Users

## 📞 للمساعدة
إذا واجهت أي مشاكل:
1. تحقق من وحدة التحكم في المتصفح (Console) للأخطاء
2. راجع Firebase Console للتأكد من الإعدادات
3. تأكد من أن جميع الخدمات مُفعلة في Firebase

---
**ملاحظة:** هذه الإعدادات ضرورية لعمل النظام بشكل صحيح وآمن.
