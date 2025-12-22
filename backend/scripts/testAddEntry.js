/**
 * Test script untuk add entry ke schedule RT 04
 */
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

// Get admin token (hardcoded untuk test)
const getToken = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@jagakampung.com',
      password: 'admin123'
    });
    console.log('✓ Login berhasil');
    return response.data.data.token;
  } catch (error) {
    console.error('✗ Login gagal:', error.response?.data?.message);
    process.exit(1);
  }
};

// Get RT 04 schedule
const getSchedule = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/schedules/month/04/2025/11`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Schedule ditemukan:', response.data.data._id);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠ Schedule belum ada, membuat yang baru...');
      return await createSchedule(token);
    }
    console.error('✗ Error:', error.response?.data?.message);
    process.exit(1);
  }
};

// Create schedule if not exists
const createSchedule = async (token) => {
  try {
    const response = await axios.post(`${BASE_URL}/schedules`, {
      rt: '04',
      month: 11,
      year: 2025
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Schedule dibuat:', response.data.data._id);
    return response.data.data;
  } catch (error) {
    console.error('✗ Error membuat schedule:', error.response?.data?.message);
    process.exit(1);
  }
};

// Add entry
const addEntry = async (token, scheduleId) => {
  try {
    console.log('\n→ Menambahkan entry ke schedule...');
    const response = await axios.post(
      `${BASE_URL}/schedules/${scheduleId}/entries`,
      {
        guardName: 'Budi Santoso',
        date: 15,
        day: 'Sabtu',
        phone: '08123456789',
        notes: 'Test entry'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('✓ Entry berhasil ditambahkan!');
    console.log('  Total entries:', response.data.data.entries.length);
    return response.data;
  } catch (error) {
    console.error('✗ Error menambahkan entry:');
    console.error('  Status:', error.response?.status);
    console.error('  Message:', error.response?.data?.message);
    console.error('  Data:', error.response?.data);
    process.exit(1);
  }
};

// Main test flow
const test = async () => {
  console.log('=== TESTING ADD ENTRY FOR RT 04 ===\n');
  
  const token = await getToken();
  const schedule = await getSchedule(token);
  await addEntry(token, schedule._id);
  
  console.log('\n✓ TEST SELESAI');
  process.exit(0);
};

test();
