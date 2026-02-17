import { PrismaClient } from '@prisma/client';
import cloudinary from '../cloudinary';

const prisma = new PrismaClient();

interface PageConfig {
  pageKey: string;
  name_en: string;
  name_ar: string;
  name_he: string;
  path: string;
}

const PAGE_CONFIGS: PageConfig[] = [
  {
    pageKey: 'home',
    path: '/',
    name_en: 'Home',
    name_ar: 'الرئيسية',
    name_he: 'בית',
  },
  {
    pageKey: 'login',
    path: '/login',
    name_en: 'Login',
    name_ar: 'تسجيل الدخول',
    name_he: 'התחברות',
  },
  {
    pageKey: 'booking-datetime',
    path: '/booking/date-time',
    name_en: 'Booking - Date & Time',
    name_ar: 'الحجز - التاريخ والوقت',
    name_he: 'הזמנה - תאריך ושעה',
  },
  {
    pageKey: 'booking-treatment',
    path: '/booking/treatment',
    name_en: 'Booking - Treatment',
    name_ar: 'الحجز - العلاج',
    name_he: 'הזמנה - טיפול',
  },
  {
    pageKey: 'booking-details',
    path: '/booking/details',
    name_en: 'Booking - Details',
    name_ar: 'الحجز - التفاصيل',
    name_he: 'הזמנה - פרטים',
  },
  {
    pageKey: 'booking-confirm',
    path: '/booking/confirm',
    name_en: 'Booking - Confirm',
    name_ar: 'الحجز - تأكيد',
    name_he: 'הזמנה - אישור',
  },
  {
    pageKey: 'success',
    path: '/success',
    name_en: 'Success',
    name_ar: 'النجاح',
    name_he: 'הצלחה',
  },
  {
    pageKey: 'not-found',
    path: '/404',
    name_en: 'Not Found',
    name_ar: 'غير موجود',
    name_he: 'לא נמצא',
  },
  {
    pageKey: 'admin-layout',
    path: '/admin/*',
    name_en: 'Admin Pages',
    name_ar: 'صفحات الإدارة',
    name_he: 'דפי ניהול',
  },
];

export class BackgroundsService {
  /**
   * Upload image to Cloudinary
   */
  private static async uploadToCloudinary(buffer: Buffer, folder: string, publicId?: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `nails-app/${folder}`,
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete image from Cloudinary
   */
  private static async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
    }
  }

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
          defaultBackgroundUrl: null,
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

    return {
      url: setting?.value || null,
    };
  }

  /**
   * Upload and update background for a page
   */
  static async uploadPageBackground(pageKey: string, buffer: Buffer) {
    const settingKey = `bg_${pageKey}`;
    const publicIdKey = `${settingKey}_publicId`;

    // Delete old image from Cloudinary if exists
    const oldPublicIdSetting = await prisma.setting.findUnique({
      where: { key: publicIdKey },
    });
    if (oldPublicIdSetting?.value) {
      await BackgroundsService.deleteFromCloudinary(oldPublicIdSetting.value);
    }

    // Upload to Cloudinary
    const { url, publicId } = await BackgroundsService.uploadToCloudinary(
      buffer,
      'backgrounds',
      `page_${pageKey}`
    );

    // Save URL and public_id to database
    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: url, updatedAt: new Date() },
      create: { key: settingKey, value: url },
    });

    await prisma.setting.upsert({
      where: { key: publicIdKey },
      update: { value: publicId, updatedAt: new Date() },
      create: { key: publicIdKey, value: publicId },
    });

    return url;
  }

  /**
   * Delete custom background (revert to default)
   */
  static async deletePageBackground(pageKey: string) {
    const settingKey = `bg_${pageKey}`;
    const publicIdKey = `${settingKey}_publicId`;

    // Get public_id and delete from Cloudinary
    const publicIdSetting = await prisma.setting.findUnique({
      where: { key: publicIdKey },
    });
    if (publicIdSetting?.value) {
      await BackgroundsService.deleteFromCloudinary(publicIdSetting.value);
    }

    // Delete settings from database
    await prisma.setting.deleteMany({
      where: {
        key: {
          in: [settingKey, publicIdKey],
        },
      },
    });
  }

  /**
   * Get all gallery images
   */
  static async getGalleryImages() {
    // Get all gallery settings from database (excluding publicId settings)
    const allSettings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'gallery_',
        },
      },
      orderBy: {
        key: 'asc',
      },
    });

    // Filter out publicId settings
    const settings = allSettings.filter((s) => !s.key.endsWith('_publicId'));

    // Return gallery images (empty array if none uploaded)
    return settings.map((setting) => ({
      id: setting.key.replace('gallery_', ''),
      url: setting.value,
      isDefault: false,
    }));
  }

  /**
   * Add a new gallery image
   */
  static async addGalleryImage(buffer: Buffer) {
    // Generate unique ID using timestamp
    const imageId = Date.now().toString();
    const settingKey = `gallery_${imageId}`;
    const publicIdKey = `${settingKey}_publicId`;

    // Upload to Cloudinary
    const { url, publicId } = await BackgroundsService.uploadToCloudinary(
      buffer,
      'gallery',
      `gallery_${imageId}`
    );

    // Save URL and public_id to database
    await prisma.setting.create({
      data: { key: settingKey, value: url },
    });

    await prisma.setting.create({
      data: { key: publicIdKey, value: publicId },
    });

    return {
      id: imageId,
      url,
      isDefault: false,
    };
  }

  /**
   * Upload and update a gallery image
   */
  static async uploadGalleryImage(imageId: string, buffer: Buffer) {
    const settingKey = `gallery_${imageId}`;
    const publicIdKey = `${settingKey}_publicId`;

    // Delete old image from Cloudinary if exists
    const oldPublicIdSetting = await prisma.setting.findUnique({
      where: { key: publicIdKey },
    });
    if (oldPublicIdSetting?.value) {
      await BackgroundsService.deleteFromCloudinary(oldPublicIdSetting.value);
    }

    // Upload to Cloudinary
    const { url, publicId } = await BackgroundsService.uploadToCloudinary(
      buffer,
      'gallery',
      `gallery_${imageId}`
    );

    // Save URL and public_id to database
    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: url, updatedAt: new Date() },
      create: { key: settingKey, value: url },
    });

    await prisma.setting.upsert({
      where: { key: publicIdKey },
      update: { value: publicId, updatedAt: new Date() },
      create: { key: publicIdKey, value: publicId },
    });

    return url;
  }

  /**
   * Delete a gallery image
   */
  static async deleteGalleryImage(imageId: string) {
    const settingKey = `gallery_${imageId}`;
    const publicIdKey = `${settingKey}_publicId`;

    // Get public_id and delete from Cloudinary
    const publicIdSetting = await prisma.setting.findUnique({
      where: { key: publicIdKey },
    });
    if (publicIdSetting?.value) {
      await BackgroundsService.deleteFromCloudinary(publicIdSetting.value);
    }

    // Delete settings from database
    await prisma.setting.deleteMany({
      where: {
        key: {
          in: [settingKey, publicIdKey],
        },
      },
    });
  }
}
