import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

interface PageConfig {
  pageKey: string;
  name_en: string;
  name_ar: string;
  name_he: string;
  path: string;
  defaultBackgroundUrl: string;
}

const PAGE_CONFIGS: PageConfig[] = [
  {
    pageKey: 'home',
    path: '/',
    name_en: 'Home',
    name_ar: 'الرئيسية',
    name_he: 'בית',
    defaultBackgroundUrl: '/salon/IMG_8395.jpg',
  },
  {
    pageKey: 'login',
    path: '/login',
    name_en: 'Login',
    name_ar: 'تسجيل الدخول',
    name_he: 'התחברות',
    defaultBackgroundUrl: '/salon/gallery-14.jpg',
  },
  {
    pageKey: 'booking-datetime',
    path: '/booking/date-time',
    name_en: 'Booking - Date & Time',
    name_ar: 'الحجز - التاريخ والوقت',
    name_he: 'הזמנה - תאריך ושעה',
    defaultBackgroundUrl: '/salon/gallery-11.jpg',
  },
  {
    pageKey: 'booking-treatment',
    path: '/booking/treatment',
    name_en: 'Booking - Treatment',
    name_ar: 'الحجز - العلاج',
    name_he: 'הזמנה - טיפול',
    defaultBackgroundUrl: '/salon/IMG_8393.jpg',
  },
  {
    pageKey: 'booking-details',
    path: '/booking/details',
    name_en: 'Booking - Details',
    name_ar: 'الحجز - التفاصيل',
    name_he: 'הזמנה - פרטים',
    defaultBackgroundUrl: '/salon/gallery-20.jpg',
  },
  {
    pageKey: 'booking-confirm',
    path: '/booking/confirm',
    name_en: 'Booking - Confirm',
    name_ar: 'الحجز - تأكيد',
    name_he: 'הזמנה - אישור',
    defaultBackgroundUrl: '/salon/gallery-17.jpg',
  },
  {
    pageKey: 'success',
    path: '/success',
    name_en: 'Success',
    name_ar: 'النجاح',
    name_he: 'הצלחה',
    defaultBackgroundUrl: '/salon/IMG_8394.jpg',
  },
  {
    pageKey: 'not-found',
    path: '/404',
    name_en: 'Not Found',
    name_ar: 'غير موجود',
    name_he: 'לא נמצא',
    defaultBackgroundUrl: '',
  },
  {
    pageKey: 'admin-layout',
    path: '/admin/*',
    name_en: 'Admin Pages',
    name_ar: 'صفحات الإدارة',
    name_he: 'דפי ניהול',
    defaultBackgroundUrl: '/salon/gallery-5.jpg',
  },
];

export class BackgroundsService {
  /**
   * Get all page backgrounds with metadata
   */
  static async getPageBackgrounds() {
    const backgrounds = await Promise.all(
      PAGE_CONFIGS.map(async (config) => {
        const settingKey = `bg_${config.pageKey}`;
        const setting = await prisma.setting.findUnique({
          where: { key: settingKey },
        });

        return {
          pageKey: config.pageKey,
          name_en: config.name_en,
          name_ar: config.name_ar,
          name_he: config.name_he,
          path: config.path,
          currentBackgroundUrl: setting?.value || null,
          defaultBackgroundUrl: config.defaultBackgroundUrl,
        };
      })
    );

    return backgrounds;
  }

  /**
   * Get background URL for a specific page
   */
  static async getPageBackground(pageKey: string) {
    const settingKey = `bg_${pageKey}`;
    const setting = await prisma.setting.findUnique({
      where: { key: settingKey },
    });

    const pageConfig = PAGE_CONFIGS.find((c) => c.pageKey === pageKey);

    return {
      url: setting?.value || pageConfig?.defaultBackgroundUrl || null,
    };
  }

  /**
   * Update background URL for a page
   */
  static async updatePageBackground(pageKey: string, imageUrl: string) {
    const settingKey = `bg_${pageKey}`;

    const setting = await prisma.setting.upsert({
      where: { key: settingKey },
      update: {
        value: imageUrl,
        updatedAt: new Date(),
      },
      create: {
        key: settingKey,
        value: imageUrl,
      },
    });

    return setting;
  }

  /**
   * Delete custom background (revert to default)
   */
  static async deletePageBackground(pageKey: string) {
    const settingKey = `bg_${pageKey}`;

    // Delete the setting
    await prisma.setting.deleteMany({
      where: { key: settingKey },
    });

    // Delete the file if it exists
    const uploadsDir = path.join(__dirname, '../../public/uploads/backgrounds');
    const files = fs.readdirSync(uploadsDir);
    const fileToDelete = files.find((file) => file.startsWith(pageKey));

    if (fileToDelete) {
      const filePath = path.join(uploadsDir, fileToDelete);
      fs.unlinkSync(filePath);
    }
  }
}
