import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Format currency to IDR
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Name of the file without extension
 * @param {String} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width columns
    const wscols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Export data to PDF with professional styling
 * @param {String} title - Main title of the document
 * @param {String} subtitle - Subtitle or period information
 * @param {Array} headers - Array of column headers
 * @param {Array} data - Array of data rows (must match headers order)
 * @param {String} fileName - Name of the file without extension
 * @param {Object} summary - Optional summary object { label, value }
 */
export const exportToPDF = ({ title, subtitle, headers, data, fileName, summary }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(26, 86, 219); // Primary Blue
    doc.text("JagaKampung", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Manajemen Warga RW 01, Sugihan, Kec. Tandes", 14, 28);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 35, pageWidth - 14, 35);

    // Document Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(title, 14, 48);

    if (subtitle) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(subtitle, 14, 55);
    }

    const timestamp = new Date().toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Dicetak pada: ${timestamp}`, pageWidth - 14, 20, { align: 'right' });

    // Table
    autoTable(doc, {
        head: [headers],
        body: data,
        startY: 65,
        theme: 'grid',
        headStyles: {
            fillColor: [37, 99, 235], // Blue-600
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center', valign: 'middle' }, // No/Index centered
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            valign: 'middle',
            overflow: 'linebreak'
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate-50
        },
        didDrawPage: (data) => {
            // Footer
            const str = 'Halaman ' + doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            doc.text("JagaKampung App", pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }
    });

    // Summary Section (if provided)
    if (summary) {
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.text(`${summary.label}: ${summary.value}`, pageWidth - 14, finalY, { align: 'right' });
    }

    doc.save(`${fileName}.pdf`);
};
