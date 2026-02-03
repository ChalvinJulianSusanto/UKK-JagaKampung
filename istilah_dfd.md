# Istilah-Istilah dalam Data Flow Diagram (DFD)

Dalam teori DFD (Data Flow Diagram), semua kotak persegi panjang yang berada di luar lingkaran sistem memiliki nama teknis yang sama, namun bisa dikategorikan lebih spesifik berdasarkan sifatnya.

## 1. Istilah Umum: "External Entity" (Entitas Eksternal)
Secara teknis DFD, baik Admin, Warga, Google, maupun Cloudinary semuanya disebut sebagai **External Entity** (atau sering juga disebut **Terminator**).

*   **Simbol:** Kotak Persegi Panjang.
*   **Definisi:** Pihak yang berada di luar sistem yang memberikan input ke sistem atau menerima output dari sistem. Admin, Warga, User, dan API luar semuanya masuk kategori ini karena mereka bukan bagian dari "proses" internal aplikasi.

---

## 2. Pembedaan Kontekstual (Agar Lebih Spesifik)
Meskipun simbolnya sama, biasanya dalam penjelasan kita membedakannya menjadi dua jenis untuk kejelasan:

### A. Human Resource / Actors (Aktor Manusia)
Merujuk pada pengguna nyata yang mengoperasikan sistem.
*   **Siapa saja?** Admin, Warga, Ketua RW, Petugas Ronda.
*   **Peran:** Mereka adalah *subjek* yang secara fisik menekan tombol, membaca layar, atau menginput data secara manual.

### B. External Systems / External Services (Sistem Eksternal)
Merujuk pada sistem komputer lain, aplikasi pihak ketiga, atau API yang berkomunikasi dengan sistem kita secara otomatis (machine-to-machine).
*   **Siapa saja?** Google (API Login), Cloudinary (Storage), Payment Gateway (jika ada).
*   **Peran:** Mereka adalah *sistem pendukung*. Sistem kita mengirim permintaan data (request), dan mereka membalas (response) tanpa campur tangan manusia secara langsung saat proses itu terjadi.

---

## Ringkasan untuk Presentasi
Jika Anda ditanya saat presentasi/sidang, jawaban paling tepat adalah:

> *"Semua kotak di sisi kiri dan kanan (Admin, Warga, Google, Cloudinary) secara teori DFD disebut sebagai **External Entities** atau **Terminator**. Namun secara spesifik, Admin dan Warga berperan sebagai **User/Aktor Manusia**, sedangkan Google dan Cloudinary berperan sebagai **External Systems/API Services**."*
