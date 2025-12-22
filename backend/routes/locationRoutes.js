const express = require('express');
const router = express.Router();
const axios = require('axios');

// Reverse geocode proxy
router.get('/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, message: 'lat dan lon wajib diisi' });
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=id&namedetails=1&extratags=1`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'JagaKampung/1.0' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal fetch alamat', error: error.message });
  }
});

module.exports = router;
