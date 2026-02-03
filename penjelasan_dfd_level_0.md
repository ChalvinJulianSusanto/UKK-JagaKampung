# Penjelasan Alur Data Flow Diagram (DFD) Level 0: Sistem Informasi JagaKampung

DFD Level 0 (atau Diagram Konteks) ini menggambarkan bagaimana **Sistem Informasi JagaKampung** berinteraksi dengan pihak luar (User dan Sistem Lain) secara garis besar.

Sistem berada di tengah (lingkaran) sebagai pusat pengolah data, dikelilingi oleh **lintas arus data** (panah) masuk dan keluar.

## 1. Interaksi Pengguna (User)

### a. ADMIN (Pengelola Utama)
*   **Alur Masuk (Input ke Sistem):** Admin memasukkan data master seperti **Data Warga**, pengaturan nominal **Iuran**, titik **Lokasi** pos ronda, dan konfigurasi **Rolling Jadwal**. Ini adalah data dasar agar sistem bisa berjalan.
*   **Alur Keluar (Output dari Sistem):** Sistem memberikan **Laporan Master** (rekap keseluruhan) dan **Log Aktivitas** agar admin bisa memantau apa yang terjadi di aplikasi.

### b. WARGA (Pengguna Umum)
*   **Alur Masuk (Input ke Sistem):** Warga melakukan **Login**, mengirim data **Pembayaran Iuran** (bukti transfer), dan mengajukan **Konfirmasi Izin** jika berhalangan hadir.
*   **Alur Keluar (Output dari Sistem):** Sistem memberikan **Info Jadwal** (kapan mereka harus jaga), **Bukti Bayar** (konfirmasi lunas), dan **Notifikasi Giliran** sebagai pengingat.

### c. PETUGAS RONDA (Role Rolling)
*   *Catatan: "Role Rolling" artinya peran ini bergantian. Warga yang sedang gilian jaga bertindak sebagai Petugas.*
*   **Alur Masuk (Input ke Sistem):** Saat bertugas, mereka mengirim **Presensi** (menggunakan Foto & GPS) dan membuat **Laporan Situasi** (misal: "Aman" atau "Ada insiden").
*   **Alur Keluar (Output dari Sistem):** Sistem memberikan **Checklist Tugas** (apa yang harus dicek saat ronda) dan **Notifikasi Darurat** jika ada alert mendesak.

### d. KETUA RW (Mendapatkan Laporan)
*   **Alur Masuk (Input ke Sistem):** Ketua RW memberikan **Persetujuan Jadwal** dan **Validasi Anggaran** (pengeluaran dana).
*   **Alur Keluar (Output dari Sistem):** Sistem menyajikan **Laporan Keamanan** (statistik kejadian) dan **Rekap Keuangan** (pemasukan vs pengeluaran) untuk transparansi.

---

## 2. Interaksi dengan Sistem Eksternal (API)

### a. GOOGLE (API Service)
*   **Fungsi:** Mengurus otentikasi login agar lebih aman dan praktis.
*   **Alur:** Sistem mengirim **Request Auth** (permintaan login). Google membalas dengan **Data User & Token** (memastikan email valid dan user berhasil masuk).

### b. CLOUDINARY (Storage)
*   **Fungsi:** Tempat penyimpanan file gambar agar server aplikasi tidak berat.
*   **Alur:** Sistem mengirim (upload) **File Image** (foto kegiatan, bukti bayar). Cloudinary membalas dengan **URL Gambar** (link) yang kemudian disimpan di database sistem untuk ditampilkan kembali.

---

## Kesimpulan Singkat
Sistem JagaKampung berperan sebagai **jembatan informasi**. Ia menerima data jadwal dan uang dari warga/admin, memprosesnya dengan bantuan Google (login) dan Cloudinary (gambar), lalu menyajikannya kembali dalam bentuk laporan yang rapi kepada Ketua RW dan notifikasi kepada petugas jaga.
