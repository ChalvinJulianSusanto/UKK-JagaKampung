const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Upload image buffer to local storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Folder name
 * @returns {Promise} - Upload result with URL
 */
const uploadToLocal = async (fileBuffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = '.jpg'; // Default to jpg
      const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to disk
      fs.writeFileSync(filePath, fileBuffer);

      // Return URL path
      const url = `/uploads/${folder}/${fileName}`;

      resolve({
        secure_url: url,
        public_id: `${folder}/${fileName}`,
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Delete image from local storage
 * @param {String} publicId - Path to file
 * @returns {Promise}
 */
const deleteFromLocal = async (publicId) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { result: 'ok' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadToLocal,
  deleteFromLocal,
};
