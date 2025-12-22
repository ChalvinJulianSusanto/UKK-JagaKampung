const ExcelJS = require('exceljs');

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
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'RT', key: 'rt', width: 8 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Alasan', key: 'reason', width: 30 },
    { header: 'Approved', key: 'approved', width: 12 },
    { header: 'Waktu Absen', key: 'timestamp', width: 20 },
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
      date: new Date(attendance.date).toLocaleDateString('id-ID'),
      name: attendance.user?.name || 'N/A',
      rt: attendance.rt,
      status: attendance.status === 'hadir' ? 'Hadir' : 'Tidak Hadir',
      reason: attendance.reason || '-',
      approved: attendance.approved ? 'Ya' : 'Belum',
      timestamp: new Date(attendance.createdAt).toLocaleString('id-ID'),
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
