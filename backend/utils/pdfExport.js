const PDFDocument = require('pdfkit');

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

      // Column widths
      const colWidths = {
        no: 30,
        date: 80,
        name: 120,
        rt: 40,
        status: 80,
        reason: 150,
        approved: 60,
        timestamp: 100,
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
        { text: 'Status', width: colWidths.status },
        { text: 'Alasan', width: colWidths.reason },
        { text: 'Approved', width: colWidths.approved },
        { text: 'Waktu Absen', width: colWidths.timestamp },
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
            text: new Date(attendance.date).toLocaleDateString('id-ID'),
            width: colWidths.date,
          },
          { text: attendance.user?.name || 'N/A', width: colWidths.name },
          { text: attendance.rt || '-', width: colWidths.rt },
          {
            text: attendance.status === 'hadir' ? 'Hadir' : 'Tidak Hadir',
            width: colWidths.status,
          },
          {
            text: attendance.reason || '-',
            width: colWidths.reason,
          },
          {
            text: attendance.approved ? 'Ya' : 'Belum',
            width: colWidths.approved,
          },
          {
            text: new Date(attendance.createdAt).toLocaleString('id-ID'),
            width: colWidths.timestamp,
          },
        ];

        rowData.forEach((data) => {
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
