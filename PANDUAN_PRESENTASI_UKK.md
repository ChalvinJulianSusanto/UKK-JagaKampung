# PANDUAN PRESENTASI UKK - JagaKampung (Sistem Informasi Keamanan Lingkungan Digital)

Dokumen ini adalah naskah dan panduan alur presentasi untuk Uji Kompetensi Keahlian (UKK). Panduan ini mencakup pembukaan, penjelasan teknis (Diagram), demo aplikasi, hingga penutup.

---

## 1. Pembukaan (2 Menit)

**Sapaan & Perkenalan:**
"Assalamualaikum Wr. Wb. Selamat pagi/siang kepada Bapak/Ibu Penguji. Perkenalkan nama saya [Nama Anda]. Pada kesempatan kali ini, saya akan mempresentasikan proyek UKK saya yang berjudul **JagaKampung: Sistem Informasi Manajemen Keamanan dan Keuangan Lingkungan Berbasis Web dan Mobile**."

**Latar Belakang Masalah:**
"Latar belakang pembuatan aplikasi ini adalah masih banyaknya pengelolaan keamanan lingkungan (Siskamling) dan keuangan warga yang dilakukan secara manual.
- Jadwal ronda sering lupa atau tertukar.
- Absensi petugas ronda tidak terpantau (hanya tanda tangan buku yang bisa dipalsukan).
- Transparansi dana iuran dan anggaran sering dipertanyakan.
- Pelaporan kejadian darurat lambat."

**Solusi:**
"JagaKampung hadir sebagai solusi digital yang mengintegrasikan pendataan warga, penjadwalan, absensi berbasis lokasi (GPS) & foto, serta transparansi keuangan dalam satu platform terintegrasi (Web untuk Admin, Mobile untuk Warga/Satpam)."

---

## 2. Analisis & Perancangan Sistem (5 Menit)

*Tampilkan slide diagram satu per satu.*

### A. Use Case Diagram
"Pertama, mari kita lihat **Use Case Diagram** untuk memahami siapa saja yang terlibat."

*   **Aktor Utama:**
    1.  **Admin (Pengurus RW/RT):** Memiliki akses penuh via Web. Tugasnya: Mengelola Data Warga (User), Membuat Jadwal Ronda, Memantau Laporan/Absensi, dan Mengelola Keuangan (Iuran/Anggaran).
    2.  **Petugas/Warga:** Mengakses via Mobile App. Tugasnya: Melihat Jadwal, Melakukan Absensi (Masuk/Pulang/Izin), dan Melihat Laporan Keuangan/Kegiatan.

### B. Data Flow Diagram (DFD)
"Selanjutnya, alur data dalam sistem digambarkan melalui DFD."

*   **DFD Level 0 (Context Diagram):**
    "Sistem JagaKampung menjadi pusat informasi. Admin memberikan input data master (Jadwal, Anggaran), dan Sistem memberikan output berupa Laporan ke warga. Warga memberikan input Absensi dan Bukti Transfer Iuran."
*   **DFD Level 1:**
    "Secara lebih rinci, sistem terbagi menjadi beberapa proses utama: Manajemen User, Manajemen Jadwal, Proses Absensi (yang terintegrasi dengan Cloudinary untuk foto), dan Manajemen Keuangan."

### C. Entity Relationship Diagram (ERD)
"Untuk struktur databasenya, aplikasi ini menggunakan basis data **NoSQL (MongoDB)** dengan skema sebagai berikut:"

*   **User:** Menyimpan data warga, role (admin/user), dan RT.
*   **Schedule & ScheduleEntry:** Menangani jadwal ronda bulanan dengan detail harian.
*   **Attendance:** Mencatat data absensi real-time (Waktu, Foto Bukti, Lokasi Lat/Long).
*   **Financials (Income & Budget):**
    *   *Poin Penting:* "Saya merancang tabel **Income** dan **Budget** dengan fleksibilitas tinggi. Kolom `kategori` tidak saya kunci (hardcode), melainkan dinamis. Ini memungkinkan pengurus untuk mencatat jenis pemasukan atau pengeluaran baru (seperti 'Sumbangan Agustusan') tanpa perlu mengubah kode program."

---

## 3. Demo Aplikasi (10 Menit)

*Buka Web Admin di Laptop (Localhost) dan proyeksikan layar HP (atau emulator) untuk tampilan Mobile.*

### Skenario 1: Admin Mengelola Lingkungan (Web)
1.  **Login Admin:** Tunjukkan halaman login dan masuk ke Dashboard.
2.  **Dashboard:** Jelaskan grafik ringkasan (Total Warga, Dana Terkumpul, Grafik Kehadiran).
3.  **Manajemen Jadwal:**
    *   Buka menu Jadwal.
    *   Demokan cara *Generate* jadwal otomatis atau tambah manual untuk bulan baru.
4.  **Manajemen Keuangan (Fitur Unggulan):**
    *   Buka menu **Kelola Keuangan**.
    *   Tunjukkan Tab **Iuran**: Melihat siapa yang sudah bayar.
    *   Tunjukkan Tab **Anggaran**: Tambah anggaran baru.
    *   *Demo Fitur Baru:* "Di sini saya menambahkan fitur kategori dinamis. Jika saya pilih 'Lainnya', saya bisa mengetik sendiri kategori pengeluaran, misalnya 'Perbaikan Pos Kamling', dan sistem akan menyimpannya."
    *   Tunjukkan fitur **Export PDF/Excel** sebagai bukti administrasi yang rapi.

### Skenario 2: Warga/Petugas Bertugas (Mobile)
1.  **Login Warga:** Masuk ke aplikasi mobile.
2.  **Cek Jadwal:** Tunjukkan notifikasi atau tampilan bahwa "Hari ini giliran Anda ronda".
3.  **Proses Absensi (Live Demo):**
    *   Klik tombol **Absen Masuk**.
    *   Ambil foto selfie (bukti kehadiran).
    *   Sistem otomatis mendeteksi Lokasi.
    *   *Simpan*.
4.  **Monitoring oleh Admin:**
    *   Kembali ke Web Admin -> menu **Kehadiran**.
    *   Tunjukkan bahwa data absensi barusan langsung muncul (Real-time) beserta foto dan jamnya.

---

## 4. Kesimpulan & Penutup (2 Menit)

**Kesimpulan:**
"Aplikasi JagaKampung berhasil mendigitalkan proses keamanan lingkungan yang tadinya manual. Keunggulan utamanya adalah:
1.  **Real-time Tracking:** Absensi petugas tidak bisa dimanipulasi karena wajib foto dan lokasi.
2.  **Transparansi Keuangan:** Warga bisa melihat penggunaan dana secara terbuka.
3.  **Fleksibilitas:** Sistem keuangan yang dinamis memudahkan pengurus mencatat berbagai jenis transaksi."

**Penutup:**
"Sekian presentasi dari saya. Saya siap untuk menjawab pertanyaan atau mendemonstrasikan fitur lain lebih mendalam jika Bapak/Ibu Penguji berkenan. Terima kasih."
