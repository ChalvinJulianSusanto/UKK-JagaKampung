# Penjelasan Use Case Diagram: Sistem Informasi JagaKampung

Dokumen ini menjelaskan alur interaksi dan istilah teknis dalam Use Case Diagram sistem JagaKampung secara ringkas agar mudah dipresentasikan.

## 1. Aktor (Pengguna Sistem)
Dalam diagram terdapat dua aktor utama yang berinteraksi dengan sistem:

*   **Petugas Jaga / Warga (Kiri):**
    *   Pengguna (user) biasa yang menjalankan aktivitas ronda/jaga.
    *   Fokus utama mereka adalah operasional: *Login, Presensi (Absen), Melihat Jadwal, dan Melihat Laporan.*
*   **Admin / Pengurus RW (Kanan):**
    *   Pengelola sistem dengan hak akses penuh (Super User).
    *   Fokus utama mereka adalah manajemen: *Mengelola Data Warga, Mengatur Jadwal, Validasi Izin, dan Mengelola Keuangan.*

## 2. Pembedahan Istilah & Relasi (Garis-garis)

### a. Association (Garis Lurus)
Menunjukkan hubungan langsung antara aktor dengan fitur.
*   *Contoh:* Garis dari "Petugas Jaga" ke "Melakukan Presensi Masuk" artinya petugas bisa melakukan absen.

### b. Include `<<include>>` (Wajib)
Menunjukkan bahwa sebuah use case **membutuhkan** use case lain agar bisa berhasil. Sifatnya **wajib/otomatis**.
*   *Pada Diagram:* **Melakukan Presensi Masuk/Pulang** `<<include>>` **Validasi Lokasi (GPS)**.
*   *Artinya:* Sistem tidak akan memproses absen jika lokasi GPS tidak valid. Absen *pasti* memicu pengecekan GPS.

### c. Extend `<<extend>>` (Oposional/Pilihan)
Menunjukkan fitur tambahan yang **bisa dipilih** (tidak wajib) dalam kondisi tertentu.
*   *Pada Diagram:*
    1.  **Ekspor Laporan** `<<extend>>` **Kelola Data Keuangan**.
        *   *Artinya:* Saat admin mengelola keuangan, dia *bisa memilih* untuk mengekspor laporan ke PDF/Excel, tapi tidak harus.
    2.  **Upload Dokumentasi** `<<extend>>` **Melihat Daftar Kegiatan**.
        *   *Artinya:* Saat melihat daftar kegiatan, pengguna (Admin) punya opsi untuk meng-upload foto dokumentasi.

## 3. Alur Cerita Singkat (Skenario)

### Skenario Petugas Jaga:
1.  **Persiapan:** Petugas melakukan **Login** dan **Melihat Jadwal & Partner** untuk tahu kapan giliran jaga.
2.  **Pelaksanaan:** Saat tiba di lokasi, Petugas **Melakukan Presensi Masuk**. Sistem secara otomatis menjalankan **Validasi Lokasi (GPS)**. Jika lokasi sesuai, absen diterima.
3.  **Monitoring:** Petugas bisa **Melihat Daftar Kegiatan** atau **Laporan Keuangan** untuk transparansi.
4.  **Selesai:** Setelah selesai jaga, Petugas **Melakukan Presensi Pulang** (kembali divalidasi GPS).

### Skenario Admin:
1.  **Manajemen:** Admin login untuk **Kelola Data Warga** (tambah/hapus warga) dan **Kelola Jadwal Jaga** (membuat jadwal bulanan).
2.  **Validasi:** Jika ada warga yang tidak masuk, Admin melakukan **Validasi Kehadiran/Izin**.
3.  **Keuangan & Laporan:** Admin membuka **Kelola Data Keuangan**. Jika butuh laporan fisik, ia memilih fitur tambahan (**Extend**) untuk **Ekspor Laporan (PDF/Excel)**.
