# Penjelasan: Role Sistem vs. Entitas DFD

Sangat tepat! Pemahaman Anda mengenai perbedaan antara **Role di Database** (Sistem Project) dengan **Entitas di Diagram** (DFD) sudah benar. Berikut adalah cara menjelaskan hubungan tersebut secara akademis/teknis:

## 1. Role Database vs. Peran Fungsional

### A. Role di Sistem (Implementation Level)
Secara coding/database, aplikasi Anda hanya mengenal **2 Akun Login**:
1.  **Admin**
2.  **Warga**

### B. Entitas di DFD (Conceptual Level)
Di DFD, kita tidak hanya menggambar "siapa yang login", tapi **"siapa yang melakukan apa"**. Satu akun bisa memerankan peran (topi) yang berbeda.

## 2. Pemetaan Hubungannya (Mapping)

### Kasus 1: Petugas Ronda (Bagian dari Warga)
*   **Di Sistem:** Dia login menggunakan akun **Role: Warga**.
*   **Di DFD:** Kita gambarkan kotak terpisah bernama **"Petugas Ronda"**.
*   **Alasannya:**
    *   Saat menjadi "Warga biasa", dia hanya melihat jadwal atau bayar iuran.
    *   Saat jam jaga tiba, dia "memakai topi" sebagai "Petugas Ronda". Alur datanya berbeda (mengirim GPS, absen foto).
    *   *Istilah:* Ini disebut **Logical Role** atau Peran Kontekstual.

### Kasus 2: Ketua RW (Pihak Luar/Otoritas)
*   **Di Sistem:** Mungkin tidak punya akun login khusus (laporan dicetak oleh Admin dan diberikan ke Ketua RW), atau login sebagai Super Admin.
*   **Di DFD:** Kita gambarkan sebagai **"Ketua RW"**.
*   **Alasannya:**
    *   Sebagai **Stakeholder** (Pemangku Kepentingan). Dia adalah tujuan akhir dari data (Konsumen Informasi).
    *   Meskipun tidak "mengklik" aplikasi secara langsung, dia menerima *output* sistem (Laporan). Karena DFD menggambarkan aliran informasi, maka Ketua RW wajib ada sebagai penerima akhir aliran tersebut.

---

## Cara Menjawab/Menjelaskan:

> *"Secara teknis sistem (autentikasi), aplikasi ini hanya memiliki dua role user yaitu **Admin** dan **Warga**.
>
> Namun dalam penggambaran DFD, saya memisahkan **Petugas Ronda** dan **Ketua RW** sebagai entitas tersendiri karena mereka memiliki **pola interaksi data yang unik**:
> *   **Petugas Ronda** adalah User Warga yang sedang dalam kondisi/state bertugas (menginput data operasional jaga).
> *   **Ketua RW** adalah entitas eksternal yang berfungsi sebagai validator dan penerima laporan (decision maker), yang menerima output dari sistem."*
