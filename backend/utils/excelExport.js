const ExcelJS = require('exceljs');

// Helper function to get day name in Indonesian
const getDayName = (date) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date(date).getDay()];
};

// Helper function to format date with day name
const formatDateWithDay = (date) => {
  const dayName = getDayName(date);
  const formattedDate = new Date(date).toLocaleDateString('id-ID');
  return `${dayName}, ${formattedDate}`;
};

// Helper function to format timestamp with day name
const formatTimestampWithDay = (date) => {
  if (!date) return '-';
  const dayName = getDayName(date);
  const formattedDateTime = new Date(date).toLocaleString('id-ID');
  return `${dayName}, ${formattedDateTime}`;
};

// Helper function to format just the time
const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Export attendance data to Excel
 * @param {Array} attendances - Array of attendance data
 * @param {String} rt - RT number (optional)
 * @returns {Buffer} - Excel file buffer
 */
const exportAttendanceToExcel = async (attendances, rt = null) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Absensi');

  // Set columns
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Tanggal', key: 'date', width: 22 },
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'RT', key: 'rt', width: 8 },
    { header: 'Jam Masuk', key: 'timeIn', width: 15 },
    { header: 'Jam Pulang', key: 'timeOut', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Alasan', key: 'reason', width: 30 },
    { header: 'Approved', key: 'approved', width: 12 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  attendances.forEach((attendance, index) => {
    worksheet.addRow({
      no: index + 1,
      date: formatDateWithDay(attendance.date),
      name: attendance.user?.name || 'N/A',
      rt: attendance.rt,
      timeIn: formatTime(attendance.checkIn),
      timeOut: formatTime(attendance.checkOut),
      status: attendance.status,
      reason: attendance.reason || '-',
      approved: attendance.approved ? 'Disetujui' : 'Belum',
    });
  });

  // Auto-fit columns (optional styling)
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  exportAttendanceToExcel,
};
