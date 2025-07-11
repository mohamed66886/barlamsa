import { notificationHelpers } from '../lib/notificationHelpers';

// دالة لإنشاء إشعارات تجريبية أولية
export const createInitialNotifications = async () => {
  try {
    console.log('إنشاء إشعارات تجريبية...');
    
    // إشعارات متنوعة للاختبار
    await notificationHelpers.dailyRecord('أحمد الحلاق', 8, 650);
    
    // تأخير بسيط بين الإشعارات
    setTimeout(async () => {
      await notificationHelpers.advanceRequest('محمد خالد', 250);
    }, 1000);
    
    setTimeout(async () => {
      await notificationHelpers.highPerformance('خالد العتيبي', 12);
    }, 2000);
    
    setTimeout(async () => {
      await notificationHelpers.expenseAdded('فاتورة كهرباء', 180);
    }, 3000);
    
    setTimeout(async () => {
      await notificationHelpers.barberLogin('سعد المالكي');
    }, 4000);
    
    setTimeout(async () => {
      await notificationHelpers.systemAlert('نظام محدث', 'تم تحديث النظام بنجاح إلى الإصدار الجديد');
    }, 5000);
    
    console.log('تم إنشاء الإشعارات التجريبية بنجاح');
  } catch (error) {
    console.error('خطأ في إنشاء الإشعارات التجريبية:', error);
  }
};

// دالة لإنشاء إشعار تجريبي واحد للاختبار السريع
export const createTestNotification = async () => {
  try {
    await notificationHelpers.systemAlert(
      'اختبار الإشعارات', 
      `إشعار تجريبي - ${new Date().toLocaleTimeString('ar-SA')}`
    );
    console.log('تم إنشاء إشعار تجريبي');
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار التجريبي:', error);
  }
};
