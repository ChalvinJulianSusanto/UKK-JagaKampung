# PANDUAN PENJELASAN KODE & LIVE CODING (ANTISIPASI UKK)

Dokumen ini mempersiapkan kamu jika penguji meminta:
1. "Coba tunjukkan kodenya dan jelaskan alurnya!"
2. "Coba buatkan fitur CRUD baru sekarang (Live Coding)!"

---

## BAGIAN 1: CARA MENJELASKAN KODE

Kunci menjelaskan kode adalah **Top-Down Approach** (dari Global ke Detail) dan menggunakan pola **MVC (Model-View-Controller)**. Jangan membaca baris per baris, tapi jelaskan **Tanggung Jawab (Responsibility)** setiap file.

### 1. Backend (Logic & Database)
Jelaskan urutannya seperti ini:

*   **Entry Point (`server.js`)**:
    *   *"Ini adalah pintu gerbang aplikasi backend saya, Pak. Di sini saya menghubungkan database (MongoDB) dan mendaftarkan semua route API (jalan masuk) agar bisa diakses oleh frontend."*
    *   Tunjukkan baris: `app.use('/api/budgets', ...)`

*   **Model (`models/Budget.js`)**:
    *   *"Ini adalah struktur datanya (Schema). Di sini saya mendefinisikan apa saja yang disimpan, tipe datanya (String, Number), dan validasinya."*
    *   *Highlight:* Tunjukkan perubahan terakhir kita (hapus enum category) sebagai contoh fleksibilitas.

*   **Controller (`controllers/budgetController.js`)**:
    *   *"Ini adalah 'otak' atau logika bisnisnya. Di sini fungsi CRUD dijalankan. Contoh function `createBudget`: menerima data dari request, memvalidasi input, lalu menyimpannya ke database via Model."*

*   **Route (`routes/budgetRoutes.js`)**:
    *   *"Ini adalah pengatur lalu lintas. Route menentukan URL mana yang akan menjalankan fungsi Controller yang mana. Contoh: Jika ada request `POST /`, arahkan ke `createBudget`."*

### 2. Frontend (Tampilan Web)
Jelaskan urutannya seperti ini:

*   **Entry Point (`App.jsx`)**:
    *   *"Di sini saya mengatur routing halaman web. Saya menggunakan `react-router-dom` untuk navigasi antar halaman tanpa refresh (SPA)."*

*   **API Service (`api/finance.js`)**:
    *   *"Saya memisahkan logika pemanggilan API ke folder `api`. Ini menggunakan `axios` untuk request ke backend. Tujuannya agar kodenya rapi dan bisa dipakai ulang."*

*   **Page (`pages/FinanceManagement.jsx`)**:
    *   *"Ini adalah halaman utamanya. Di sini saya menggunakan State (`useState`) untuk menyimpan data sementara, dan Effect (`useEffect`) untuk mengambil data saat halaman dibuka."*

*   **Component (`components/common/...`)**:
    *   *"Saya menggunakan komponen reuseable seperti `Button`, `Input`, dan `Modal` agar desain konsisten dan kode tidak berulang-ulang."*

---

## BAGIAN 2: STRATEGI LIVE CODING (JIKA DIMINTA BUAT CRUD BARU)

**Skenario:** Penguji bilang: *"Coba buatkan fitur sederhana 'Pengumuman' (Announcement). Isinya cuma Judul dan Isi. Bisa Create dan Read saja."*

**JANGAN PANIK.** Kunci suksesnya adalah **COPY-PASTE & MODIFY**. Jangan mengetik dari nol.

### Langkah 1: Backend (Model)
1.  Buka folder `backend/models`.
2.  Copy file `Income.js` (karena sederhana), paste dan rename jadi `Pengumuman.js`.
3.  Edit isinya:
    ```javascript
    const mongoose = require('mongoose');
    const PengumumanSchema = new mongoose.Schema({
        judul: { type: String, required: true },
        isi: { type: String, required: true },
    }, { timestamps: true });
    module.exports = mongoose.model('Pengumuman', PengumumanSchema);
    ```

### Langkah 2: Backend (Controller)
1.  Buka folder `backend/controllers`.
2.  Copy `incomeController.js`, paste dan rename jadi `pengumumanController.js`.
3.  Lakukan **Find & Replace** (Ctrl+H):
    *   Cari: `Income` -> Ganti: `Pengumuman` (Match Case on)
    *   Cari: `income` -> Ganti: `pengumuman`
4.  Hapus logika filter yang ribet, sisakan `getAll` dan `create` saja yang simpel.

### Langkah 3: Backend (Route)
1.  Buka `backend/routes`.
2.  Copy `incomeRoutes.js`, rename jadi `pengumumanRoutes.js`.
3.  Ganti import controllernya ke `pengumumanController`.
4.  Buka `server.js`, tambahkan: `app.use('/api/pengumuman', require('./routes/pengumumanRoutes'));`

**TEST DULU DI POSTMAN (Opsional tapi bagus):** Coba POST dan GET. Kalau jalan, lanjut Frontend.

### Langkah 4: Frontend (API)
1.  Buka `frontend-web/src/api/finance.js` (atau buat baru `general.js`).
2.  Copy blok `incomeAPI`, paste dan ubah jadi `pengumumanAPI`.
3.  Ganti endpointnya jadi `/pengumuman`.

### Langkah 5: Frontend (Halaman)
1.  Buka `pages`. Copy `FinanceManagement.jsx` (terlalu kompleks sih, cari yang lebih simpel kalau ada, misal `Activities.jsx`). Tapi oke, copy `FinanceManagement.jsx`, rename `Pengumuman.jsx`.
2.  Hapus Tabs, hapus Filter yang ribet.
3.  Sisakan satu tombol "Tambah Pengumuman" dan satu Tabel simple (Judul, Isi).
4.  Ubah `useState` untuk menampung data pengumuman.
5.  Ubah form di Modal jadi cuma 2 input: Judul dan Isi.

### Langkah 6: Daftarkan di App.jsx
1.  Buka `App.jsx`.
2.  Import `Pengumuman`.
3.  Tambah `<Route path="pengumuman" element={<Pengumuman />} />`

---

## TIPS PENTING SAAT LIVE CODING
1.  **Bicara saat mengetik:** *"Sekarang saya akan membuat Model untuk Pengumuman..."*. Ini mencegah *awkward silence* dan menunjukkan kamu paham alurnya.
2.  **Sederhanakan:** Jika penguji tidak minta validasi ribet, jangan dibuat. Buat se-minimal mungkin (Judul & Isi saja).
3.  **Jujur:** Kalau error, baca terminal. *"Oh, sepertinya saya lupa mendaftarkan route di server.js"*. Memperbaiki error dengan tenang itu nilai plus besar.
