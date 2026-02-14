import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsService {
  /**
   * Get all settings
   */
  static async getSettings() {
    return prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get a single setting by key
   */
  static async getSetting(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new Error(`Setting '${key}' not found`);
    }

    return setting;
  }

  /**
   * Update a setting value
   */
  static async updateSetting(key: string, value: string) {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
      },
    });

    return setting;
  }
}
