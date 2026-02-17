import { Router } from 'express';
import { BackgroundsService } from '../services/backgrounds.service';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadBackground } from '../middleware/upload';

const router = Router();

/**
 * GET /api/backgrounds
 * Get all page backgrounds with metadata
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const backgrounds = await BackgroundsService.getPageBackgrounds();
    res.json(backgrounds);
  })
);

/**
 * GET /api/backgrounds/:pageKey
 * Get background for a specific page
 */
router.get(
  '/:pageKey',
  asyncHandler(async (req, res) => {
    const background = await BackgroundsService.getPageBackground(req.params.pageKey);
    res.json(background);
  })
);

/**
 * POST /api/backgrounds/:pageKey/upload
 * Upload a new background image (admin only)
 */
router.post(
  '/:pageKey/upload',
  authenticateToken,
  requireAdmin,
  uploadBackground.single('image'),
  asyncHandler(async (req, res) => {
    const pageKey = req.params.pageKey;
    const file = req.file;

    if (!file || !file.buffer) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const imageUrl = await BackgroundsService.uploadPageBackground(pageKey, file.buffer);

    res.json({ url: imageUrl });
  })
);

/**
 * DELETE /api/backgrounds/:pageKey
 * Delete custom background (revert to default) - admin only
 */
router.delete(
  '/:pageKey',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await BackgroundsService.deletePageBackground(req.params.pageKey);
    res.json({ message: 'Background reset to default' });
  })
);

/**
 * GET /api/backgrounds/gallery/images
 * Get all gallery images
 */
router.get(
  '/gallery/images',
  asyncHandler(async (req, res) => {
    const images = await BackgroundsService.getGalleryImages();
    res.json(images);
  })
);

/**
 * POST /api/backgrounds/gallery/add
 * Add a new gallery image (admin only)
 */
router.post(
  '/gallery/add',
  authenticateToken,
  requireAdmin,
  uploadBackground.single('image'),
  asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file || !file.buffer) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const image = await BackgroundsService.addGalleryImage(file.buffer);

    res.json(image);
  })
);

/**
 * POST /api/backgrounds/gallery/:imageId/upload
 * Replace a gallery image (admin only)
 */
router.post(
  '/gallery/:imageId/upload',
  authenticateToken,
  requireAdmin,
  uploadBackground.single('image'),
  asyncHandler(async (req, res) => {
    const imageId = req.params.imageId;
    const file = req.file;

    if (!file || !file.buffer) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const imageUrl = await BackgroundsService.uploadGalleryImage(imageId, file.buffer);

    res.json({ url: imageUrl });
  })
);

/**
 * DELETE /api/backgrounds/gallery/:imageId
 * Delete a gallery image - admin only
 */
router.delete(
  '/gallery/:imageId',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const imageId = req.params.imageId;
    await BackgroundsService.deleteGalleryImage(imageId);
    res.json({ message: 'Gallery image deleted' });
  })
);

export default router;
