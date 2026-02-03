const PDFDocument = require('pdfkit');

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
 * Export attendance data to PDF
 * @param {Array} attendances - Array of attendance data
 * @param {String} rt - RT number (optional)
 * @returns {PDFDocument} - PDF document stream
 */
const exportAttendanceToPDF = (attendances, rt = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Rekap Absensi JagaKampung', { align: 'center' });

      doc.moveDown(0.5);

      // Subtitle
      if (rt) {
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`RT ${rt}`, { align: 'center' });
      }

      doc
        .fontSize(10)
        .text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, {
          align: 'center',
        });

      doc.moveDown(1);

      // Table Header
      const tableTop = doc.y;
      const itemHeight = 25;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // Column widths - Optimized untuk timestamp lebih panjang
      const colWidths = {
        no: 30,
        date: 85,
        name: 120,
        rt: 35,
        timeIn: 70, // Increased width
        timeOut: 70, // Increased width to prevent wrapping
        status: 60,
        reason: 120,
        approved: 60,
      };

      // Draw header background
      doc
        .rect(
          doc.page.margins.left,
          tableTop,
          pageWidth,
          itemHeight
        )
        .fill('#1976D2');

      // Header text
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);

      let currentX = doc.page.margins.left + 5;

      // Draw headers
      const headers = [
        { text: 'No', width: colWidths.no },
        { text: 'Tanggal', width: colWidths.date },
        { text: 'Nama', width: colWidths.name },
        { text: 'RT', width: colWidths.rt },
        { text: 'Jam Masuk', width: colWidths.timeIn },
        { text: 'Jam Pulang', width: colWidths.timeOut },
        { text: 'Status', width: colWidths.status },
        { text: 'Alasan', width: colWidths.reason },
        { text: 'Approved', width: colWidths.approved },
      ];

      headers.forEach((header) => {
        doc.text(header.text, currentX, tableTop + 8, {
          width: header.width - 10,
          align: 'left',
        });
        currentX += header.width;
      });

      doc.moveDown();

      // Table rows
      let currentY = tableTop + itemHeight;
      const maxY = doc.page.height - doc.page.margins.bottom - 50;

      attendances.forEach((attendance, index) => {
        // Check if we need a new page
        if (currentY > maxY) {
          doc.addPage({
            size: 'A4',
            layout: 'landscape',
            margin: 50,
          });
          currentY = doc.page.margins.top;

          // Redraw header on new page
          doc
            .rect(doc.page.margins.left, currentY, pageWidth, itemHeight)
            .fill('#1976D2');

          doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
          currentX = doc.page.margins.left + 5;

          headers.forEach((header) => {
            doc.text(header.text, currentX, currentY + 8, {
              width: header.width - 10,
              align: 'left',
            });
            currentX += header.width;
          });

          currentY += itemHeight;
        }

        // Alternate row colors
        const rowColor = index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
        doc
          .rect(doc.page.margins.left, currentY, pageWidth, itemHeight)
          .fill(rowColor);

        // Row data
        doc.fillColor('#000000').font('Helvetica').fontSize(8);

        currentX = doc.page.margins.left + 5;

        const rowData = [
          { text: (index + 1).toString(), width: colWidths.no },
          {
            text: formatDateWithDay(attendance.date),
            width: colWidths.date,
          },
          { text: attendance.user?.name || 'N/A', width: colWidths.name },
          { text: attendance.rt || '-', width: colWidths.rt },
          { text: formatTime(attendance.checkIn), width: colWidths.timeIn },
          { text: formatTime(attendance.checkOut), width: colWidths.timeOut },
          {
            text: attendance.status,
            width: colWidths.status,
          },
          {
            text: attendance.reason || '-',
            width: colWidths.reason,
          },
          {
            text: attendance.approved ? 'Disetujui' : 'Belum',
            width: colWidths.approved,
          },
        ];

        rowData.forEach((data, colIndex) => {
          // Use smaller font for timestamp column to fit in one line
          const fontSize = colIndex === 7 ? 7 : 8; // Column 7 is timestamp
          doc.fontSize(fontSize);

          doc.text(data.text, currentX, currentY + 8, {
            width: data.width - 10,
            align: 'left',
            lineBreak: false,
            ellipsis: true,
          });
          currentX += data.width;
        });

        currentY += itemHeight;
      });

      // Footer
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor('#666666')
          .text(
            `Halaman ${i + 1} dari ${totalPages}`,
            doc.page.margins.left,
            doc.page.height - doc.page.margins.bottom + 10,
            { align: 'center' }
          );
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  exportAttendanceToPDF,
};
