import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'ar' | 'he' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Common
    'app.name': 'حجز الأظافر',
    'common.book': 'احجز موعد',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'نجح',
    'common.login': 'تسجيل الدخول',
    'common.logout': 'تسجيل الخروج',
    'common.admin': 'الإدارة',
    'common.home': 'الرئيسية',
    
    // Home
    'home.title': 'مرحباً بك في صالون الأظافر',
    'home.subtitle': 'احجز موعدك للحصول على أظافر جميلة',
    'home.description': 'نقدم خدمات عناية بالأظافر عالية الجودة في بيئة مريحة وفاخرة. احجز موعدك الآن واستمتع بتجربة استثنائية.',
    
    // Booking Steps
    'booking.step1': 'التاريخ والوقت',
    'booking.step2': 'اختر العلاج',
    'booking.step3': 'التفاصيل',
    'booking.step4': 'تأكيد',
    'booking.selectDate': 'اختر التاريخ',
    'booking.selectTime': 'اختر الوقت',
    'booking.noSlots': 'لا توجد أوقات متاحة في هذا اليوم',
    'booking.selectTreatment': 'اختر العلاج',
    'booking.selectedTreatment': 'العلاج المختار',
    'booking.duration': 'المدة',
    'booking.price': 'السعر',
    'booking.minutes': 'دقيقة',
    'booking.customerDetails': 'تفاصيل العميل',
    'booking.fullName': 'الاسم الكامل',
    'booking.phone': 'رقم الهاتف',
    'booking.notes': 'ملاحظات (اختياري)',
    'booking.summary': 'ملخص الحجز',
    'booking.date': 'التاريخ',
    'booking.time': 'الوقت',
    'booking.treatment': 'العلاج',
    'booking.confirmBooking': 'تأكيد الحجز',
    'booking.success': 'تم الحجز بنجاح!',
    'booking.successMessage': 'تم تأكيد حجزك. سنرسل لك تذكيراً قبل موعدك بساعة.',
    'booking.bookAnother': 'احجز موعد آخر',
    
    // Admin
    'admin.dashboard': 'لوحة التحكم',
    'admin.treatments': 'العلاجات',
    'admin.availability': 'الأوقات المتاحة',
    'admin.appointments': 'المواعيد',
    'admin.settings': 'الإعدادات',
    'admin.addTreatment': 'إضافة علاج',
    'admin.editTreatment': 'تعديل العلاج',
    'admin.treatmentName': 'اسم العلاج',
    'admin.treatmentNameAr': 'الاسم بالعربية',
    'admin.treatmentNameHe': 'الاسم بالعبرية',
    'admin.treatmentNameEn': 'الاسم بالإنجليزية',
    'admin.durationMinutes': 'المدة (بالدقائق)',
    'admin.active': 'نشط',
    'admin.inactive': 'غير نشط',
    'admin.status': 'الحالة',
    'admin.actions': 'الإجراءات',
    'admin.noTreatments': 'لا توجد علاجات',
    'admin.addAvailability': 'إضافة وقت متاح',
    'admin.dayOfWeek': 'يوم الأسبوع',
    'admin.startTime': 'وقت البدء',
    'admin.endTime': 'وقت الانتهاء',
    'admin.slotInterval': 'فترة الفتحة (بالدقائق)',
    'admin.noAvailability': 'لا توجد أوقات متاحة',
    'admin.upcomingAppointments': 'المواعيد القادمة',
    'admin.noAppointments': 'لا توجد مواعيد',
    'admin.customerName': 'اسم العميل',
    'admin.cancelAppointment': 'إلغاء الموعد',
    'admin.reminders': 'التذكيرات',
    'admin.enableReminders': 'تفعيل التذكيرات',
    'admin.reminderDescription': 'إرسال تذكير بالبريد الإلكتروني قبل الموعد بساعة',
    'admin.createAppointment': 'إنشاء موعد',
    'admin.appointmentDetails': 'تفاصيل الموعد',
    'admin.appointmentCreated': 'تم إنشاء الموعد بنجاح',
    'admin.selectTreatment': 'اختر العلاج',
    'admin.selectDateFirst': 'اختر التاريخ أولاً',
    'admin.backgrounds': 'المظهر',

    // Backgrounds & Gallery
    'appearance.title': 'إدارة المظهر',
    'appearance.description': 'إدارة خلفيات الصفحات وصور المعرض',
    'appearance.pageBackgrounds': 'خلفيات الصفحات',
    'appearance.pageBackgroundsDesc': 'قم بتحميل وإدارة صور الخلفية لكل صفحة',
    'appearance.homeGallery': 'معرض الصفحة الرئيسية',
    'appearance.homeGalleryDesc': 'قم بتحميل وإدارة الصور المعروضة في الصفحة الرئيسية',
    'backgrounds.upload': 'رفع صورة',
    'backgrounds.reset': 'إعادة تعيين',
    'backgrounds.uploading': 'جاري الرفع...',
    'backgrounds.current': 'الخلفية الحالية',
    'backgrounds.custom': 'مخصص',
    'backgrounds.maxSize': 'الحد الأقصى: 5 ميجابايت',
    'backgrounds.confirmReset': 'هل أنت متأكد من إعادة تعيين إلى الافتراضي؟',
    'gallery.image': 'صورة',

    // Days of week
    'day.sunday': 'الأحد',
    'day.monday': 'الاثنين',
    'day.tuesday': 'الثلاثاء',
    'day.wednesday': 'الأربعاء',
    'day.thursday': 'الخميس',
    'day.friday': 'الجمعة',
    'day.saturday': 'السبت',
    
    // Auth
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.loginTitle': 'تسجيل دخول الإدارة',
    'auth.loginButton': 'تسجيل الدخول',
    'auth.loginError': 'خطأ في تسجيل الدخول',
  },
  he: {
    // Common
    'app.name': 'הזמנת ציפורניים',
    'common.book': 'הזמן תור',
    'common.cancel': 'ביטול',
    'common.confirm': 'אישור',
    'common.save': 'שמור',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.back': 'חזור',
    'common.next': 'הבא',
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.login': 'התחבר',
    'common.logout': 'התנתק',
    'common.admin': 'ניהול',
    'common.home': 'בית',
    
    // Home
    'home.title': 'ברוכים הבאים לסלון הציפורניים',
    'home.subtitle': 'הזמן את התור שלך לציפורניים יפות',
    'home.description': 'אנו מציעים שירותי טיפוח ציפורניים באיכות גבוהה בסביבה נוחה ומפנקת. הזמן את התור שלך עכשיו ותיהנה מחוויה יוצאת דופן.',
    
    // Booking Steps
    'booking.step1': 'תאריך ושעה',
    'booking.step2': 'בחר טיפול',
    'booking.step3': 'פרטים',
    'booking.step4': 'אישור',
    'booking.selectDate': 'בחר תאריך',
    'booking.selectTime': 'בחר שעה',
    'booking.noSlots': 'אין שעות פנויות ביום זה',
    'booking.selectTreatment': 'בחר טיפול',
    'booking.selectedTreatment': 'טיפול נבחר',
    'booking.duration': 'משך',
    'booking.price': 'מחיר',
    'booking.minutes': 'דקות',
    'booking.customerDetails': 'פרטי לקוח',
    'booking.fullName': 'שם מלא',
    'booking.phone': 'טלפון',
    'booking.notes': 'הערות (אופציונלי)',
    'booking.summary': 'סיכום הזמנה',
    'booking.date': 'תאריך',
    'booking.time': 'שעה',
    'booking.treatment': 'טיפול',
    'booking.confirmBooking': 'אשר הזמנה',
    'booking.success': 'ההזמנה בוצעה בהצלחה!',
    'booking.successMessage': 'ההזמנה שלך אושרה. נשלח לך תזכורת שעה לפני התור.',
    'booking.bookAnother': 'הזמן תור נוסף',
    
    // Admin
    'admin.dashboard': 'לוח בקרה',
    'admin.treatments': 'טיפולים',
    'admin.availability': 'זמינות',
    'admin.appointments': 'תורים',
    'admin.settings': 'הגדרות',
    'admin.addTreatment': 'הוסף טיפול',
    'admin.editTreatment': 'ערוך טיפול',
    'admin.treatmentName': 'שם הטיפול',
    'admin.treatmentNameAr': 'שם בערבית',
    'admin.treatmentNameHe': 'שם בעברית',
    'admin.treatmentNameEn': 'שם באנגלית',
    'admin.durationMinutes': 'משך (בדקות)',
    'admin.active': 'פעיל',
    'admin.inactive': 'לא פעיל',
    'admin.status': 'סטטוס',
    'admin.actions': 'פעולות',
    'admin.noTreatments': 'אין טיפולים',
    'admin.addAvailability': 'הוסף זמינות',
    'admin.dayOfWeek': 'יום בשבוע',
    'admin.startTime': 'שעת התחלה',
    'admin.endTime': 'שעת סיום',
    'admin.slotInterval': 'מרווח זמן (בדקות)',
    'admin.noAvailability': 'אין זמינות',
    'admin.upcomingAppointments': 'תורים קרובים',
    'admin.noAppointments': 'אין תורים',
    'admin.customerName': 'שם לקוח',
    'admin.cancelAppointment': 'בטל תור',
    'admin.reminders': 'תזכורות',
    'admin.enableReminders': 'הפעל תזכורות',
    'admin.reminderDescription': 'שלח תזכורת במייל שעה לפני התור',
    'admin.createAppointment': 'צור תור',
    'admin.appointmentDetails': 'פרטי התור',
    'admin.appointmentCreated': 'התור נוצר בהצלחה',
    'admin.selectTreatment': 'בחר טיפול',
    'admin.selectDateFirst': 'בחר תאריך קודם',
    'admin.backgrounds': 'מראה',

    // Backgrounds & Gallery
    'appearance.title': 'ניהול מראה',
    'appearance.description': 'נהל רקעי דפים ותמונות גלריה',
    'appearance.pageBackgrounds': 'רקעי דפים',
    'appearance.pageBackgroundsDesc': 'העלה ונהל תמונות רקע לכל דף',
    'appearance.homeGallery': 'גלריית דף הבית',
    'appearance.homeGalleryDesc': 'העלה ונהל תמונות המוצגות בדף הבית',
    'backgrounds.upload': 'העלה תמונה',
    'backgrounds.reset': 'אפס',
    'backgrounds.uploading': 'מעלה...',
    'backgrounds.current': 'רקע נוכחי',
    'backgrounds.custom': 'מותאם אישית',
    'backgrounds.maxSize': 'גודל מקסימלי: 5MB',
    'backgrounds.confirmReset': 'האם אתה בטוח שברצונך לאפס לברירת מחדל?',
    'gallery.image': 'תמונה',

    // Days of week
    'day.sunday': 'ראשון',
    'day.monday': 'שני',
    'day.tuesday': 'שלישי',
    'day.wednesday': 'רביעי',
    'day.thursday': 'חמישי',
    'day.friday': 'שישי',
    'day.saturday': 'שבת',
    
    // Auth
    'auth.email': 'אימייל',
    'auth.password': 'סיסמה',
    'auth.loginTitle': 'כניסת מנהל',
    'auth.loginButton': 'התחבר',
    'auth.loginError': 'שגיאת התחברות',
  },
  en: {
    // Common
    'app.name': 'Nails Booking',
    'common.book': 'Book Appointment',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.login': 'Login',
    'common.logout': 'Logout',
    'common.admin': 'Admin',
    'common.home': 'Home',
    
    // Home
    'home.title': 'Welcome to Nails Salon',
    'home.subtitle': 'Book your appointment for beautiful nails',
    'home.description': 'We offer high-quality nail care services in a comfortable and luxurious environment. Book your appointment now and enjoy an exceptional experience.',
    
    // Booking Steps
    'booking.step1': 'Date & Time',
    'booking.step2': 'Select Treatment',
    'booking.step3': 'Details',
    'booking.step4': 'Confirm',
    'booking.selectDate': 'Select Date',
    'booking.selectTime': 'Select Time',
    'booking.noSlots': 'No available slots on this day',
    'booking.selectTreatment': 'Select Treatment',
    'booking.selectedTreatment': 'Selected Treatment',
    'booking.duration': 'Duration',
    'booking.price': 'Price',
    'booking.minutes': 'minutes',
    'booking.customerDetails': 'Customer Details',
    'booking.fullName': 'Full Name',
    'booking.phone': 'Phone Number',
    'booking.notes': 'Notes (optional)',
    'booking.summary': 'Booking Summary',
    'booking.date': 'Date',
    'booking.time': 'Time',
    'booking.treatment': 'Treatment',
    'booking.confirmBooking': 'Confirm Booking',
    'booking.success': 'Booking Successful!',
    'booking.successMessage': 'Your booking has been confirmed. We will send you a reminder one hour before your appointment.',
    'booking.bookAnother': 'Book Another Appointment',
    
    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.treatments': 'Treatments',
    'admin.availability': 'Availability',
    'admin.appointments': 'Appointments',
    'admin.settings': 'Settings',
    'admin.addTreatment': 'Add Treatment',
    'admin.editTreatment': 'Edit Treatment',
    'admin.treatmentName': 'Treatment Name',
    'admin.treatmentNameAr': 'Name in Arabic',
    'admin.treatmentNameHe': 'Name in Hebrew',
    'admin.treatmentNameEn': 'Name in English',
    'admin.durationMinutes': 'Duration (minutes)',
    'admin.active': 'Active',
    'admin.inactive': 'Inactive',
    'admin.status': 'Status',
    'admin.actions': 'Actions',
    'admin.noTreatments': 'No treatments',
    'admin.addAvailability': 'Add Availability',
    'admin.dayOfWeek': 'Day of Week',
    'admin.startTime': 'Start Time',
    'admin.endTime': 'End Time',
    'admin.slotInterval': 'Slot Interval (minutes)',
    'admin.noAvailability': 'No availability',
    'admin.upcomingAppointments': 'Upcoming Appointments',
    'admin.noAppointments': 'No appointments',
    'admin.customerName': 'Customer Name',
    'admin.cancelAppointment': 'Cancel Appointment',
    'admin.reminders': 'Reminders',
    'admin.enableReminders': 'Enable Reminders',
    'admin.reminderDescription': 'Send email reminder one hour before appointment',
    'admin.createAppointment': 'Create Appointment',
    'admin.appointmentDetails': 'Appointment Details',
    'admin.appointmentCreated': 'Appointment created successfully',
    'admin.selectTreatment': 'Select a treatment',
    'admin.selectDateFirst': 'Select a date first',
    'admin.backgrounds': 'Appearance',

    // Backgrounds & Gallery
    'appearance.title': 'Manage Appearance',
    'appearance.description': 'Manage page backgrounds and gallery images',
    'appearance.pageBackgrounds': 'Page Backgrounds',
    'appearance.pageBackgroundsDesc': 'Upload and manage background images for each page',
    'appearance.homeGallery': 'Home Page Gallery',
    'appearance.homeGalleryDesc': 'Upload and manage images displayed on the home page',
    'backgrounds.upload': 'Upload Image',
    'backgrounds.reset': 'Reset to Default',
    'backgrounds.uploading': 'Uploading...',
    'backgrounds.current': 'Current Background',
    'backgrounds.custom': 'Custom',
    'backgrounds.maxSize': 'Max size: 5MB',
    'backgrounds.confirmReset': 'Are you sure you want to reset to default?',
    'gallery.image': 'Image',

    // Days of week
    'day.sunday': 'Sunday',
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.loginTitle': 'Admin Login',
    'auth.loginButton': 'Login',
    'auth.loginError': 'Login Error',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('dir', language === 'en' ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'en' ? 'ltr' : 'rtl';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
