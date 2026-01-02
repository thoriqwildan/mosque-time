# Jam Masjid Digital (Web Based)

Aplikasi Jam Masjid Digital berbasis web yang ringan, dirancang untuk berjalan pada perangkat dengan spesifikasi rendah (seperti RSB-3410 dengan Ubuntu 14.04) maupun browser modern.

## Fitur Utama

- **Jadwal Sholat Otomatis:** Perhitungan berdasarkan koordinat (Latitude/Longitude) menggunakan _Adhan.js_.
- **Mode Offline:** Berjalan 100% di _localhost_ tanpa internet (setelah setup awal).
- **Dual View:** Tampilan TV (`index.html`) dan Panel Admin (`admin.html`).
- **Countdown & Ihtiyati:** Hitung mundur menuju adzan dan koreksi waktu sholat.
- **Kompatibilitas:** Mendukung browser lama (Legacy Flexbox Support).

---

## Persyaratan Sistem (Prerequisites)

- PHP 5.4 atau lebih baru.
- Web Browser (Chrome/Chromium/Firefox).
- Apache.

---

## Cara Instalasi

Pastikan Apache sudah terinstall di board

### 1. Clone & Deploy

Buka terminal dan jalankan perintah berikut baris per baris:

```bash
# 1. Masuk ke folder home dan clone
cd ~
git clone <repository-url>
cd jam-masjid-php

# 2. Bersihkan web root default Apache
sudo rm -rf /var/www/html/*

# 3. Salin kode project ke web root
sudo cp -r * /var/www/html/

# 4. Pindah ke direktori web root untuk setting permission
cd /var/www/html/

# 5. Buat file data.json (jika belum ada)
sudo touch data.json

# 6. Set Permission (PENTING)
# Ubah pemilik folder ke user apache (www-data)
sudo chown -R www-data:www-data /var/www/html

# Set hak akses: Folder bisa dibaca, data.json bisa ditulis
sudo chmod -R 755 /var/www/html
sudo chmod 666 /var/www/html/data.json
```
