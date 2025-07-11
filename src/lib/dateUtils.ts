// أدوات التاريخ والوقت - التقويم الميلادي

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatDateArabic = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });
};

export const formatDateTimeArabic = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    calendar: 'gregory'
  });
};

// الحصول على بداية اليوم الحالي (منتصف الليل)
export const getStartOfDay = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

// الحصول على نهاية اليوم الحالي (قبل منتصف الليل بثانية)
export const getEndOfDay = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
};

// التحقق من أن التاريخ هو اليوم الحالي
export const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

// الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// معالجة التاريخ من Firebase timestamp
export const formatFirebaseDate = (timestamp: unknown): string => {
  if (!timestamp) return formatDate(new Date());
  
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    return formatDate((timestamp as { toDate: () => Date }).toDate());
  }
  
  return formatDate(new Date(timestamp as string | number));
};

// معالجة التاريخ والوقت من Firebase timestamp
export const formatFirebaseDateTime = (timestamp: unknown): string => {
  if (!timestamp) return formatDateTime(new Date());
  
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    return formatDateTime((timestamp as { toDate: () => Date }).toDate());
  }
  
  return formatDateTime(new Date(timestamp as string | number));
};

// دالة للحصول على تاريخ اليوم بالاعتماد على منتصف الليل كبداية يوم جديد
export const getTodayForNewDay = (): string => {
  const now = new Date();
  // إذا كان الوقت بعد منتصف الليل، فهو يوم جديد
  return now.toISOString().split('T')[0];
};

// دالة للتحقق من أن التاريخ هو اليوم الحالي بناءً على منتصف الليل
export const isTodayForNewDay = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  
  // مقارنة التاريخ مع التاريخ الحالي (بناءً على منتصف الليل)
  return d.toDateString() === today.toDateString();
};
