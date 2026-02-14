import { PrismaClient, Treatment } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTreatmentDto {
  nameAr: string;
  nameHe: string;
  nameEn: string;
  durationMinutes: number;
  price: number;
  isActive?: boolean;
}

export interface UpdateTreatmentDto {
  nameAr?: string;
  nameHe?: string;
  nameEn?: string;
  durationMinutes?: number;
  price?: number;
  isActive?: boolean;
}

export class TreatmentsService {
  /**
   * Transform Prisma treatment to frontend format (camelCase to snake_case)
   */
  private static transformTreatment(t: Treatment) {
    return {
      id: t.id,
      name_ar: t.nameAr,
      name_he: t.nameHe,
      name_en: t.nameEn,
      duration_minutes: t.durationMinutes,
      price: t.price.toNumber(),
      is_active: t.isActive,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
    };
  }

  /**
   * Get all treatments (optionally filter by active status)
   */
  static async getTreatments(activeOnly: boolean = true) {
    const treatments = await prisma.treatment.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return treatments.map(this.transformTreatment);
  }

  /**
   * Get a single treatment by ID
   */
  static async getTreatmentById(id: string) {
    const treatment = await prisma.treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      throw new Error('Treatment not found');
    }

    return this.transformTreatment(treatment);
  }

  /**
   * Create a new treatment
   */
  static async createTreatment(data: CreateTreatmentDto) {
    const treatment = await prisma.treatment.create({
      data: {
        nameAr: data.nameAr,
        nameHe: data.nameHe,
        nameEn: data.nameEn,
        durationMinutes: data.durationMinutes,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    });

    return this.transformTreatment(treatment);
  }

  /**
   * Update a treatment
   */
  static async updateTreatment(id: string, data: UpdateTreatmentDto) {
    const treatment = await prisma.treatment.update({
      where: { id },
      data: {
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.nameHe !== undefined && { nameHe: data.nameHe }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.durationMinutes !== undefined && {
          durationMinutes: data.durationMinutes,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });

    return this.transformTreatment(treatment);
  }

  /**
   * Delete a treatment
   */
  static async deleteTreatment(id: string) {
    await prisma.treatment.delete({
      where: { id },
    });

    return { message: 'Treatment deleted successfully' };
  }
}
