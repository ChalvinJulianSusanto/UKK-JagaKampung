# 📊 PANDUAN DIAGRAM JAGAKAMPUNG

## 🎯 Overview

Folder ini berisi diagram-diagram teknis untuk sistem **JagaKampung** yang dapat dibuka dengan **Draw.io** (diagrams.net). Semua diagram telah dibuat dengan format `.drawio` yang kompatibel dengan aplikasi Draw.io baik versi desktop maupun online.

---

## 📁 Daftar Diagram

### 1. **ERD_JagaKampung.drawio** - Entity Relationship Diagram
**Tujuan:** Menunjukkan struktur database dan hubungan antar tabel/collection MongoDB

**Isi Diagram:**
- ✅ **5 Collections MongoDB:**
  - `Users` - Data pengguna (admin & warga)
  - `Schedules` - Jadwal ronda per RT
  - `Attendances` - Data absensi dengan foto
  - `Notifications` - Sistem notifikasi
  - `RTs` - Data RT (01-06)

- 🔗 **Relationships:**
  - One-to-Many: Users → Schedules (uploadedBy)
  - One-to-Many: Users → Attendances (user)
  - One-to-Many: Users → Attendances (approvedBy)
  - One-to-Many: Schedules → Attendances
  - One-to-Many: Users → Notifications

- 🔑 **Key Features:**
  - Primary Keys (ObjectId)
  - Foreign Keys dengan referensi
  - Unique constraints
  - Indexes untuk performa
  - Timestamps otomatis

**Kapan Digunakan:**
- Saat merancang database baru
- Dokumentasi arsitektur database
- Memahami relasi antar data
- Training developer baru

---

### 2. **DFD_Level0_JagaKampung.drawio** - Data Flow Diagram Level 0
**Tujuan:** Menunjukkan gambaran umum sistem dan aliran data utama (Context Diagram)

**Isi Diagram:**
- 🎭 **External Entities:**
  - Admin (Pengelola sistem)
  - Warga (Pengguna aplikasi)
  - Kepala RT (Penerima laporan)
  - Cloudinary (Cloud storage)
  - Database MongoDB

- 🔄 **Data Flows:**
  1. Login credentials → Sistem
  2. Kelola user data
  3. Upload jadwal ronda
  4. Approve absensi
  5. Submit absensi + foto
  6. Request jadwal & history
  7. Laporan & dashboard
  8. Notifikasi & info
  9. Upload/download files

- ⭕ **Central System:** Sistem JagaKampung (semua proses terpusat)

**Kapan Digunakan:**
- Presentasi ke stakeholder
- Dokumentasi high-level
- Memahami scope sistem secara keseluruhan
- Proposal proyek

---

### 3. **DFD_Level1_JagaKampung.drawio** - Data Flow Diagram Level 1
**Tujuan:** Menunjukkan detail proses internal sistem dan aliran data antar proses

**Isi Diagram:**
- 🔧 **8 Processes:**
  1. **Authentication & Authorization** - Login, register, JWT validation
  2. **User Management** - CRUD users, ban/unban
  3. **Schedule Management** - Upload, update, delete jadwal
  4. **Attendance Management** - Submit, approve, photo upload
  5. **Notification System** - Send, broadcast, mark read
  6. **Dashboard & Reporting** - Statistics, export Excel/PDF
  7. **File Management** - Cloudinary upload, local storage
  8. **RT Management** - RT data filtering (01-06)

- 📦 **Data Stores:**
  - D1: Users
  - D2: Schedules
  - D3: Attendances
  - D4: Notifications
  - D5: RTs

- 🔗 **Process Interactions:**
  - Trigger notifications antar proses
  - Query data dari multiple datastores
  - File upload workflow
  - Filter by RT

**Kapan Digunakan:**
- Development planning
- Dokumentasi teknis detail
- Code review dan refactoring
- Testing strategy

---

### 4. **FLOWCHART_JagaKampung.drawio** - System Flowchart
**Tujuan:** Menunjukkan alur proses bisnis step-by-step dengan decision points

**Isi Diagram - 5 Main Flows:**

#### **A. Authentication Flow**
```
START → Input Email & Password → Validate Credentials →
Valid? → YES: Generate JWT (30 days) → Redirect to Dashboard → END
      → NO: Show Error Message → (loop back)
```

#### **B. Schedule Upload Flow (Admin)**
```
START → Select RT, Month, Year & Upload File →
Check Duplicate (RT+Month+Year)? →
  DUPLICATE: Show Error → (loop back)
  OK: Upload to Cloudinary → Save to Database →
      Send Notifications to All Users in RT → END
```

#### **C. Attendance Submission Flow (Warga)**
```
START → Select Schedule & Date → Already Submitted Today? →
  YES: Show Error → (loop back)
  NO: Select Status (Hadir/Tidak Hadir) → Upload Photo →
      Capture GPS Location (Optional) → Upload Photo to Cloudinary →
      Save to Database (approved: false) →
      Show Success & Wait for Approval → END
```

#### **D. Attendance Approval Flow (Admin)**
```
START → View Pending Attendance List →
Select Attendance Record & Review Photo → Approve? →
  YES: Update Record (approved: true, approvedBy, approvedAt) →
       Send Notification to User → END
  NO: Delete Record or Add Rejection Note → END
```

#### **E. Dashboard & Export Flow**
```
START → Select Report Type (Statistics/Export) →
Query Aggregated Data (Users, Schedules, Attendances) →
Export Type? →
  EXCEL: Generate Excel (ExcelJS) → END
  PDF: Generate PDF (PDFKit) → END
  VIEW: Display Statistics with Recharts → END
```

**Kapan Digunakan:**
- User training & documentation
- Business process analysis
- QA testing scenarios
- Bug troubleshooting

---

## 🚀 Cara Membuka Diagram

### **Opsi 1: Draw.io Online (Recommended)**
1. Buka browser dan kunjungi: **https://app.diagrams.net/**
2. Pilih "Open Existing Diagram"
3. Pilih "Device" atau "Computer"
4. Browse ke folder `JagaKampung/diagrams/`
5. Pilih file `.drawio` yang ingin dibuka
6. Edit dan save sesuka hati

### **Opsi 2: Draw.io Desktop (Offline)**
1. Download Draw.io desktop dari: **https://www.drawio.com/download**
2. Install aplikasi
3. Buka aplikasi Draw.io
4. File → Open → Browse ke `JagaKampung/diagrams/`
5. Pilih file `.drawio` yang ingin dibuka

### **Opsi 3: VS Code Extension**
1. Install extension "Draw.io Integration" di VS Code
2. Buka file `.drawio` langsung dari VS Code
3. Edit inline di editor

---

## 🎨 Konvensi Warna dalam Diagram

| Warna | Penggunaan | Contoh |
|-------|-----------|--------|
| 🔵 **Biru** (`#dae8fc`) | Users & Authentication | Users table, Login process |
| 🟢 **Hijau** (`#d5e8d4`) | Schedules & Success | Schedules table, Success flow |
| 🟡 **Kuning** (`#ffe6cc`) | Attendances & Database | Attendances table, DB operations |
| 🟣 **Ungu** (`#e1d5e7`) | Notifications & Files | Notifications table, File uploads |
| 🔴 **Merah** (`#f8cecc`) | Admin & Errors | Admin entity, Error messages |
| ⚪ **Abu-abu** (`#f5f5f5`) | Reference Tables | RTs table |

---

## 📝 Symbol Guide

### **ERD (Entity Relationship Diagram)**
- **🔑 PK (Primary Key)** - _id fields (ObjectId)
- **🔗 FK (Foreign Key)** - Referensi ke collection lain
- **📧 Unique** - Field dengan constraint unique
- **🏘️ RT Reference** - Field RT (01-06)
- **→ One-to-Many** - Relasi 1:N (solid line)
- **⇢ Optional** - Relasi opsional (dashed line)

### **DFD (Data Flow Diagram)**
- **▭ External Entity** - Aktor eksternal (Admin, Warga, dll)
- **⭕ Process** - Proses/fungsi sistem (ellipse)
- **▭ Data Store** - Database table/collection (open rectangle)
- **→ Data Flow** - Aliran data (solid arrow)
- **⇢ Control Flow** - Aliran kontrol (dashed arrow)

### **Flowchart**
- **⭕ Terminal** - START/END (ellipse)
- **▱ Process** - Proses/aksi (rectangle)
- **▱ Input/Output** - Input/output data (parallelogram)
- **◇ Decision** - Kondisi/decision point (diamond)
- **🗄️ Database** - Operasi database (cylinder)
- **→ Flow** - Alur proses (arrow)

---

## 🛠️ Tips Editing Diagram

### **Menambah Elemen Baru**
1. Drag & drop dari panel kiri
2. Atau gunakan shortcut: `Ctrl+K` (shapes menu)
3. Double-click untuk edit text

### **Mengubah Warna**
1. Select elemen
2. Klik "Fill Color" di toolbar atas
3. Pilih warna sesuai konvensi

### **Menambah Connector (Panah)**
1. Klik "Connector" tool di toolbar
2. Atau tekan `Ctrl+Shift+C`
3. Drag dari satu shape ke shape lain
4. Edit label dengan double-click di panah

### **Export ke Format Lain**
- **PNG:** File → Export as → PNG (untuk dokumentasi)
- **PDF:** File → Export as → PDF (untuk presentasi)
- **SVG:** File → Export as → SVG (untuk web)
- **JPEG:** File → Export as → JPEG (untuk email)

### **Shortcut Penting**
- `Ctrl+C` - Copy
- `Ctrl+V` - Paste
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+D` - Duplicate
- `Delete` - Hapus
- `Ctrl+G` - Group elements
- `Ctrl+Shift+G` - Ungroup

---

## 📖 Use Cases per Diagram

### **ERD → Untuk Developer & DBA**
- ✅ Merancang schema baru
- ✅ Membuat migration files
- ✅ Optimasi query dengan indexes
- ✅ Memahami relasi data
- ✅ Code review model definitions

### **DFD Level 0 → Untuk Stakeholder & PM**
- ✅ Presentasi proposal proyek
- ✅ Scope definition
- ✅ Budget planning
- ✅ High-level documentation
- ✅ Client meetings

### **DFD Level 1 → Untuk Architect & Lead Developer**
- ✅ System design review
- ✅ API endpoint planning
- ✅ Microservices breakdown
- ✅ Performance optimization
- ✅ Security audit

### **Flowchart → Untuk QA & Business Analyst**
- ✅ Test case creation
- ✅ User acceptance testing (UAT)
- ✅ Business process documentation
- ✅ Training materials
- ✅ Bug reproduction steps

---

## 🔄 Update & Maintenance

### **Kapan Harus Update Diagram?**
1. ✏️ **Schema Changes** - Update ERD saat ada perubahan database
2. 🆕 **New Features** - Update DFD dan Flowchart untuk fitur baru
3. 🐛 **Bug Fixes** - Update Flowchart jika ada perubahan logic
4. 📝 **Refactoring** - Update DFD Level 1 saat restructure code
5. 🔐 **Security Changes** - Update semua diagram terkait

### **Version Control**
- Simpan diagram di Git bersama kode
- Gunakan commit message yang jelas
- Tag diagram dengan versi aplikasi
- Backup file `.drawio` secara berkala

### **Collaboration Tips**
- Share link Draw.io online untuk kolaborasi real-time
- Export ke PNG untuk review via Slack/email
- Gunakan comments di Draw.io untuk feedback
- Lock layers untuk prevent accidental changes

---

## 🆘 Troubleshooting

### **File Tidak Bisa Dibuka**
- ✅ Pastikan menggunakan Draw.io versi terbaru
- ✅ Coba buka dengan Draw.io online (app.diagrams.net)
- ✅ Check file extension (harus `.drawio` atau `.xml`)
- ✅ Verify file tidak corrupt dengan text editor

### **Diagram Terlalu Besar**
- ✅ Zoom out dengan scroll wheel
- ✅ Gunakan "Fit to Window" (Ctrl+Shift+F)
- ✅ Split ke multiple pages jika perlu
- ✅ Export ke PDF dengan scaling

### **Performance Issues**
- ✅ Close unused tabs di Draw.io online
- ✅ Reduce complexity per page
- ✅ Gunakan Draw.io desktop untuk file besar
- ✅ Disable auto-save sementara saat edit

---

## 📚 Referensi Tambahan

### **Learn More About:**
- **ERD Best Practices:** https://www.lucidchart.com/pages/er-diagrams
- **DFD Tutorial:** https://www.visual-paradigm.com/guide/data-flow-diagram/
- **Flowchart Standards:** https://www.lucidchart.com/pages/flowchart-symbols
- **Draw.io Documentation:** https://www.diagrams.net/doc/

### **JagaKampung Documentation:**
- **Backend API:** `../backend/README.md`
- **Frontend Admin:** `../frontend-web/README.md`
- **Frontend Warga:** `../frontend-mobile/README.md`
- **Project Structure:** `../PROJECT_STRUCTURE_ANALYSIS.md`

---

## ✅ Checklist untuk Reviewer

Saat review diagram, pastikan:

- [ ] Semua entities/processes terlabel dengan jelas
- [ ] Warna sesuai konvensi (lihat tabel warna)
- [ ] Arrows menunjukkan arah yang benar
- [ ] Tidak ada elemen yang overlap/tumpang tindih
- [ ] Font size readable (minimum 10pt)
- [ ] Legend/keterangan lengkap
- [ ] Consistent naming (camelCase/snake_case)
- [ ] No orphan elements (semua terkoneksi)
- [ ] Notes/documentation included
- [ ] File size reasonable (<5MB)

---

## 🎯 Quick Reference Table

| Diagram | File | Best For | Update Frequency |
|---------|------|----------|------------------|
| ERD | `ERD_JagaKampung.drawio` | Database design | Every schema change |
| DFD L0 | `DFD_Level0_JagaKampung.drawio` | High-level overview | Major feature additions |
| DFD L1 | `DFD_Level1_JagaKampung.drawio` | Detailed processes | Process changes |
| Flowchart | `FLOWCHART_JagaKampung.drawio` | Business logic | Logic/workflow changes |

---

## 📞 Contact & Support

**Questions about diagrams?**
- 💬 Slack: #jagakampung-dev
- 📧 Email: dev@jagakampung.com
- 📝 Create issue: GitHub Issues
- 📖 Wiki: Project Documentation

---

## 📄 License & Credits

**Created By:** Claude Code (Anthropic AI)
**Date:** November 4, 2025
**Version:** 1.0.0
**Format:** Draw.io (.drawio)
**License:** Internal use only - JagaKampung Project

---

## 🎉 Selamat Menggunakan Diagram!

Diagram-diagram ini dibuat dengan detail untuk membantu Anda memahami sistem JagaKampung secara menyeluruh. Jangan ragu untuk mengedit dan customize sesuai kebutuhan proyek Anda.

**Happy diagramming! 🚀**

---

*Last Updated: November 4, 2025*
*Generated by: Claude Code Assistant*
