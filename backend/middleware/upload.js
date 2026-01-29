const multer = require('multer');
const path = require('path');

// Configure multer untuk menyimpan file di memory
const storage = multer.memoryStorage();

// Filter file - hanya terima gambar
const fileFilter = (req, file, cb) => {
  // Check allowed field names
  if (file.fieldname !== 'photo' && file.fieldname !== 'documentation') {
    cb(new Error('Field upload tidak valid'));
    return;
  }

  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan!'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;
