const multer = require('multer');
const path = require('path');

// Configure multer untuk menyimpan file di memory
const storage = multer.memoryStorage();

// Filter file - terima gambar dan PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = /jpeg|jpg|png|pdf|application\/pdf/.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, JPG, PNG) atau PDF yang diperbolehkan!'));
  }
};

// Multer configuration untuk schedule
const uploadSchedule = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max 10MB untuk PDF
  },
  fileFilter: fileFilter,
});

module.exports = uploadSchedule;
