const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if Cloudinary is configured
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

/**
 * Upload schedule file to local storage
 */
const uploadToLocal = async (fileBuffer, fileType, fileExtension) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'schedules');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, fileBuffer);

      // Return full URL for local storage
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const url = `${baseUrl}/uploads/schedules/${fileName}`;

      resolve({
        secure_url: url,
        public_id: `schedules/${fileName}`,
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Upload schedule file (image or PDF) to Cloudinary or Local
 * @param {Buffer} fileBuffer - File buffer dari multer
 * @param {String} fileType - Type of file ('image' or 'pdf')
 * @param {String} fileExtension - File extension (e.g., '.pdf', '.jpg')
 * @param {String} folder - Folder name
 * @returns {Promise} - Upload result
 */
const uploadScheduleFile = (fileBuffer, fileType, fileExtension, folder = 'jagakampung/schedules') => {
  // Use local storage if Cloudinary is not configured
  if (!isCloudinaryConfigured) {
    return uploadToLocal(fileBuffer, fileType, fileExtension);
  }

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: fileType === 'pdf' ? 'raw' : 'image',
    };

    // Jika gambar, tambahkan transformasi
    if (fileType === 'image') {
      uploadOptions.transformation = [
        { width: 1200, height: 1600, crop: 'limit' },
        { quality: 'auto' },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete schedule file from Cloudinary or Local
 * @param {String} publicId - Public ID dari file
 * @param {String} resourceType - Resource type ('raw' for PDF, 'image' for images)
 * @returns {Promise}
 */
const deleteScheduleFile = async (publicId, resourceType = 'image') => {
  try {
    // Delete from local storage if Cloudinary is not configured
    if (!isCloudinaryConfigured) {
      const filePath = path.join(__dirname, '..', 'uploads', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { result: 'ok' };
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadScheduleFile,
  deleteScheduleFile,
};
