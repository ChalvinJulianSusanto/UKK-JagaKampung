# 🗄️ MongoDB Setup Guide

## ❌ Error yang Terjadi

```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.jgndu21.mongodb.net
```

Ini berarti MongoDB Atlas cluster tidak bisa diakses dari komputer Anda.

---

## ✅ Solusi: Pilih salah satu opsi berikut

### **Opsi 1: Fix MongoDB Atlas (Recommended untuk Production)**

#### Step 1: Whitelist IP Address di MongoDB Atlas

1. **Login ke MongoDB Atlas**
   - Buka https://cloud.mongodb.com
   - Login dengan akun Anda

2. **Whitelist All IPs (Untuk Development)**
   - Klik **Network Access** di menu kiri
   - Klik **Add IP Address**
   - Pilih **Allow Access From Anywhere**
   - Atau masukkan: `0.0.0.0/0`
   - Klik **Confirm**

   ![Network Access](https://imgur.com/placeholder.png)

3. **Tunggu beberapa detik** untuk perubahan diterapkan

#### Step 2: Pastikan Cluster Aktif

1. Klik **Database** di menu kiri
2. Pastikan cluster status adalah **ACTIVE**
3. Jika status "PAUSED", klik **Resume**

#### Step 3: Verify Connection String

1. Klik **Connect** pada cluster Anda
2. Pilih **Connect your application**
3. Copy connection string
4. Pastikan format di `.env` benar:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Note:** Ganti `<username>` dan `<password>` dengan credentials yang benar!

#### Step 4: Restart Backend

```bash
# Tekan Ctrl+C untuk stop backend
# Kemudian run lagi:
npm run dev
```

---

### **Opsi 2: Gunakan MongoDB Local (Easiest untuk Development)**

Jika Anda ingin development cepat tanpa setup MongoDB Atlas:

#### Step 1: Install MongoDB Local

**Windows:**
```bash
# Download MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Atau via Chocolatey:
choco install mongodb
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
```

#### Step 2: Start MongoDB Service

**Windows:**
```bash
# MongoDB sudah auto-start sebagai service
# Atau manual:
mongod
```

**macOS/Linux:**
```bash
brew services start mongodb-community
# atau
sudo systemctl start mongod
```

#### Step 3: Update `.env`

Edit file `backend/.env`:

```env
# Comment atau hapus MongoDB Atlas URI
# MONGODB_URI=mongodb+srv://...

# Ganti dengan local MongoDB
MONGODB_URI=mongodb://localhost:27017/jagakampung
```

#### Step 4: Restart Backend

```bash
npm run dev
```

✅ **Seharusnya berhasil connect:**
```
🚀 Server running in development mode on port 5000
MongoDB Connected: localhost
```

---

### **Opsi 3: Gunakan MongoDB Docker (Alternative)**

Jika Anda familiar dengan Docker:

```bash
# Pull MongoDB image
docker pull mongo

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo

# Update .env
MONGODB_URI=mongodb://localhost:27017/jagakampung
```

---

## 🔍 Verifikasi Koneksi

Setelah MongoDB running, test koneksi:

### Via MongoDB Compass (GUI Tool)

1. Download: https://www.mongodb.com/try/download/compass
2. Install dan buka
3. Connect string: `mongodb://localhost:27017`
4. Lihat database `jagakampung` (akan dibuat otomatis)

### Via MongoDB Shell

```bash
# Connect
mongosh mongodb://localhost:27017

# List databases
show dbs

# Use database
use jagakampung

# Show collections
show collections
```

---

## 🎯 Recommended Setup untuk Development

**Gunakan MongoDB Local** karena:
- ✅ Lebih cepat (no network latency)
- ✅ Offline development
- ✅ No IP whitelist issues
- ✅ Free unlimited storage di local
- ✅ Mudah reset data untuk testing

**Gunakan MongoDB Atlas** untuk:
- ✅ Production deployment
- ✅ Team collaboration
- ✅ Automatic backups
- ✅ Cloud accessibility

---

## 📝 Update .env File

**Untuk Local MongoDB:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jagakampung
JWT_SECRET=jagakampung_secret_key_2025_super_secure
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=djqczplje
CLOUDINARY_API_KEY=657889854696578
CLOUDINARY_API_SECRET=g3Sj30gUJlJiwcwY19ef9UAAsZ4
```

**Untuk MongoDB Atlas:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jagakampung?retryWrites=true&w=majority
JWT_SECRET=jagakampung_secret_key_2025_super_secure
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=djqczplje
CLOUDINARY_API_KEY=657889854696578
CLOUDINARY_API_SECRET=g3Sj30gUJlJiwcwY19ef9UAAsZ4
```

---

## 🚀 Quick Fix

**Paling cepat untuk testing sekarang:**

```bash
# 1. Install MongoDB local
# Windows: Download dari mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# 2. Update backend/.env
# Ubah line MONGODB_URI menjadi:
MONGODB_URI=mongodb://localhost:27017/jagakampung

# 3. Restart backend
cd backend
npm run dev
```

---

## ✅ Success Indicators

Jika berhasil, Anda akan melihat:

```
🚀 Server running in development mode on port 5000
MongoDB Connected: localhost
```

atau

```
🚀 Server running in development mode on port 5000
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

---

## 🐛 Troubleshooting Lanjutan

### Error: MongoDB not found
```bash
# Pastikan MongoDB service running
# Windows:
net start MongoDB

# Mac:
brew services list

# Linux:
sudo systemctl status mongod
```

### Error: Connection timeout
```bash
# Check firewall
# Pastikan port 27017 tidak diblock
```

### Error: Authentication failed
```bash
# Pastikan username & password benar di connection string
# Atau untuk local, remove auth:
MONGODB_URI=mongodb://localhost:27017/jagakampung
```

---

**Choose one option and follow the steps above!** 🚀
