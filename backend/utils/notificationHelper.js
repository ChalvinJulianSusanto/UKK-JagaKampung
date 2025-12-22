const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create notification helper
 * @param {String} userId - User ID yang akan menerima notifikasi
 * @param {String} type - Type: success, info, warning, error
 * @param {String} title - Judul notifikasi
 * @param {String} message - Pesan notifikasi
 * @param {String} link - Optional link
 * @param {Object} metadata - Optional metadata
 */
const createNotification = async (userId, type, title, message, link = null, metadata = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      metadata,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notification untuk semua admin
 */
const notifyAllAdmins = async (type, title, message, link = null, metadata = {}) => {
  try {
    const admins = await User.find({ role: 'admin' });

    const notifications = await Promise.all(
      admins.map((admin) =>
        Notification.create({
          user: admin._id,
          type,
          title,
          message,
          link,
          metadata,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error notifying admins:', error);
    return [];
  }
};

/**
 * Create notification untuk semua user di RT tertentu
 */
const notifyUsersByRT = async (rt, type, title, message, link = null, metadata = {}) => {
  try {
    console.log(`[notifyUsersByRT] Starting for RT: ${rt}, type: ${type}`);

    const users = await User.find({ rt, role: 'user' }).lean();
    console.log(`[notifyUsersByRT] Found ${users.length} users for RT ${rt}`);

    if (users.length === 0) {
      console.warn(`[notifyUsersByRT] No users found for RT ${rt}. Skipping notification.`);
      return [];
    }

    const notifications = await Promise.all(
      users.map((user) => {
        console.log(`[notifyUsersByRT] Creating notification for user ${user._id}`);
        return Notification.create({
          user: user._id,
          type,
          title,
          message,
          link,
          metadata,
        });
      })
    );

    console.log(`[notifyUsersByRT] Successfully created ${notifications.length} notifications for RT ${rt}`);
    return notifications;
  } catch (error) {
    console.error('Error in notifyUsersByRT:', {
      message: error.message,
      stack: error.stack,
      rt,
      type,
    });
    return [];
  }
};

/**
 * Create notification untuk user berdasarkan email
 * @param {String} email - Email user yang akan menerima notifikasi
 * @param {String} type - Type: success, info, warning, error
 * @param {String} title - Judul notifikasi
 * @param {String} message - Pesan notifikasi
 * @param {String} link - Optional link
 * @param {Object} metadata - Optional metadata
 */
const notifyUserByEmail = async (email, type, title, message, link = null, metadata = {}) => {
  try {
    if (!email) {
      console.warn('[notifyUserByEmail] No email provided. Skipping notification.');
      return null;
    }

    console.log(`[notifyUserByEmail] Looking for user with email: ${email}`);

    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();

    if (!user) {
      console.warn(`[notifyUserByEmail] No user found with email: ${email}. Skipping notification.`);
      return null;
    }

    console.log(`[notifyUserByEmail] Found user ${user._id} (${user.name}). Creating notification...`);

    const notification = await Notification.create({
      user: user._id,
      type,
      title,
      message,
      link,
      metadata,
    });

    console.log(`[notifyUserByEmail] Successfully created notification for user ${user.name} (${email})`);
    return notification;
  } catch (error) {
    console.error('Error in notifyUserByEmail:', {
      message: error.message,
      stack: error.stack,
      email,
      type,
    });
    return null;
  }
};

/**
 * Notification templates untuk berbagai event
 */
const NotificationTemplates = {
  // User registration
  newUserRegistered: (userName, userRT) => ({
    type: 'info',
    title: 'Pendaftaran User Baru',
    message: `User "${userName}" dari RT ${userRT} telah mendaftar`,
    link: '/users',
  }),

  // Attendance
  newAttendance: (userName, status) => ({
    type: status === 'hadir' ? 'success' : 'warning',
    title: 'Absensi Baru',
    message: `${userName} melakukan absensi dengan status: ${status}`,
    link: '/attendances',
  }),

  attendanceApproved: (status) => ({
    type: 'success',
    title: 'Absensi Disetujui',
    message: `Absensi Anda telah ${status ? 'disetujui' : 'ditolak'} oleh admin`,
    link: '/history',
  }),

  // Schedule
  newScheduleUploaded: (rt, month, year) => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const dayName = dayNames[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();

    return {
      type: 'info',
      title: 'Jadwal Baru Tersedia',
      message: `Jadwal telah diterbitkan ke jadwal ronda\nRT ${rt} pada ${dayName}, ${date}/${currentMonth}/${currentYear}`,
      link: '/schedule',
    };
  },

  scheduleUpdated: (rt, month, year) => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const dayName = dayNames[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const monthName = monthNames[month - 1] || month;

    return {
      type: 'warning',
      title: 'Jadwal Diperbarui',
      message: `Jadwal ronda telah diperbarui\nRT ${rt} - ${monthName} ${year}\nDiperbarui pada ${dayName}, ${date}/${currentMonth}/${currentYear}`,
      link: '/schedule',
    };
  },

  // User status
  userBanned: () => ({
    type: 'error',
    title: 'Akun Diblokir',
    message: 'Akun Anda telah diblokir oleh admin. Hubungi admin untuk informasi lebih lanjut',
    link: null,
  }),

  userUnbanned: () => ({
    type: 'success',
    title: 'Akun Diaktifkan',
    message: 'Akun Anda telah diaktifkan kembali oleh admin',
    link: null,
  }),

  // Report
  reportGenerated: (reportType, period) => ({
    type: 'success',
    title: 'Laporan Siap',
    message: `Laporan ${reportType} untuk periode ${period} telah dibuat`,
    link: '/reports',
  }),
};

module.exports = {
  createNotification,
  notifyAllAdmins,
  notifyUsersByRT,
  notifyUserByEmail,
  NotificationTemplates,
};
