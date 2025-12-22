# 🗄️ Setup Database - JagaKampung

## Opsi 1: MongoDB Atlas (Recommended - Gratis & Mudah)

### Langkah-langkah:

#### 1. Buat Akun MongoDB Atlas
1. Kunjungi: https://www.mongodb.com/cloud/atlas/register
2. Daftar dengan email atau Google account
3. Pilih **FREE** tier (M0 Sandbox - 512 MB)

#### 2. Buat Cluster
1. Pilih **Cloud Provider**: AWS, Google Cloud, atau Azure (pilih yang terdekat)
2. Pilih **Region**: Singapore atau Jakarta (untuk latency rendah)
3. Cluster Tier: **M0 Sandbox (FREE)**
4. Cluster Name: `JagaKampung` atau biarkan default
5. Klik **Create Cluster** (tunggu 3-5 menit)

#### 3. Setup Database Access
1. Klik **Database Access** di sidebar kiri
2. Klik **Add New Database User**
3. Authentication Method: **Password**
4. Username: `jagakampung_admin`
5. Password: Generate password atau buat sendiri (SIMPAN PASSWORD INI!)
6. Database User Privileges: **Read and write to any database**
7. Klik **Add User**

#### 4. Setup Network Access
1. Klik **Network Access** di sidebar kiri
2. Klik **Add IP Address**
3. Pilih **Allow Access from Anywhere** (untuk development)
4. IP Address akan otomatis: `0.0.0.0/0`
5. Klik **Confirm**

#### 5. Dapatkan Connection String
1. Kembali ke **Database** (Clusters)
2. Klik tombol **Connect** pada cluster Anda
3. Pilih **Connect your application**
4. Driver: **Node.js**
5. Version: **4.1 or later**
6. Copy connection string, contoh:
   ```
   mongodb+srv://jagakampung_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

#### 6. Update .env Backend
Buka file `backend/.env` dan update:
```env
MONGODB_URI=mongodb+srv://jagakampung_admin:PASSWORD_ANDA@cluster0.xxxxx.mongodb.net/jagakampung?retryWrites=true&w=majority
```

**PENTING**:
- Ganti `<password>` atau `PASSWORD_ANDA` dengan password yang Anda buat di step 3
- Tambahkan `/jagakampung` setelah `.net` untuk nama database
- Jangan ada spasi dalam connection string

#### 7. Test Connection
```bash
cd backend
npm run dev
```

Jika berhasil, akan muncul:
```
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

---

## Opsi 2: MongoDB Local (Untuk Development Offline)

### Windows:

#### 1. Download MongoDB Community Server
https://www.mongodb.com/try/download/community

#### 2. Install MongoDB
- Pilih **Complete** installation
- Install as **Windows Service**
- Install **MongoDB Compass** (GUI Tool)

#### 3. Start MongoDB Service
```bash
net start MongoDB
```

#### 4. Verify Installation
```bash
mongosh
```

#### 5. Backend .env sudah sesuai:
```env
MONGODB_URI=mongodb://localhost:27017/jagakampung
```

### Linux/Mac:

#### Ubuntu/Debian:
```bash
# Import MongoDB public GPG Key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
```

#### macOS (dengan Homebrew):
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongosh
```

---

## ✅ Verifikasi Setup

Setelah setup selesai, test dengan:

```bash
cd backend
npm run dev
```

**Output yang diharapkan:**
```
🚀 Server running in development mode on port 5000
MongoDB Connected: [hostname]
```

---

## 🔒 Security Tips

1. **Jangan commit .env** - Sudah ada di .gitignore
2. **Gunakan password yang kuat** untuk MongoDB Atlas
3. **Untuk production**:
   - Gunakan specific IP whitelist (bukan 0.0.0.0/0)
   - Gunakan environment variables yang aman
   - Enable authentication di MongoDB local

---

## 🆘 Troubleshooting

### Error: "Authentication failed"
- Pastikan username dan password benar di connection string
- Pastikan user sudah dibuat di MongoDB Atlas

### Error: "Network timeout"
- Cek Network Access di MongoDB Atlas
- Pastikan 0.0.0.0/0 sudah ditambahkan

### Error: "ECONNREFUSED" (Local)
- MongoDB service belum jalan: `net start MongoDB` (Windows)
- MongoDB belum terinstall

### Error: "MongoServerError: bad auth"
- Password di connection string salah
- Encode special characters dalam password (gunakan URL encoding)

---

## 📞 Support

Jika masih ada masalah, cek:
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Local Documentation: https://docs.mongodb.com/manual/
