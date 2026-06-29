# Blackbox Testing — Indekos Ungu

Prosedur testing manual (blackbox) untuk memvalidasi semua fitur dashboard, invoice, API, dan aksi CRUD.

## Setup

### 1. Siapkan database

```bash
cd packages/database

# Buat/refresh database dari schema
bun run db:push

# Seed data lengkap — selalu fresh
bun run db:seed-blackbox
```

> **password default:** admin → `admin123`, staff → `staff123`, owner → `owner123`

### 2. Jalankan dev server

```bash
cd site
bun run dev
```

Buka `http://localhost:4321`

### 3. Jalankan scheduler (opsional, untuk cron testing)

```bash
cd packages/scheduler

# Trigger ad-hoc (untuk test generate invoice / overdue / reminder)
bun run trigger overdue 2026-06-15   # tandai invoice yg lewat tgl 15 Juni sbg overdue
bun run trigger reminder 2026-06-28  # generate reminder utk invoice yg due 3 hari lagi
bun run trigger invoice 2026-06-01   # generate invoice baru untuk bulan Juni

# Atau jalankan cron scheduler (berjalan terus):
bun run index
```

---

## Data Seed (sudah tersedia setelah seed)

| Entity           | Jumlah | Catatan                                                                  |
| ---------------- | ------ | ------------------------------------------------------------------------ |
| Users            | 5      | admin, staff, owner, system, bot-wa                                      |
| Kamar            | 15     | 14 terisi, 0 kosong, 1 nonaktif (E-02); 10 standard, 5 premium           |
| Penghuni         | 17     | 14 aktif, 3 selesai; 1 belum verifikasi (Intan)                          |
|                  |        | Multi-lease: Ahmad pindah, Dian sewa ulang, Bayu ganti kamar,            |
|                  |        | Rizky 3× lease (balik ke A-02), Citra sewa ulang F-02                    |
| Kontrak Sewa     | 23     | 14 aktif (1 berakhir bulan depan), 9 selesai                             |
| Komplain         | 4      | 2 open, 1 in_progress, 1 resolved (lengkap dg catatan)                   |
| Invoice          | 10     | 4 paid, 4 unpaid, 2 overdue                                              |
| Chatbot Messages | 6      | 3 incoming, 3 outgoing; tenant Rina, Siti, Fajar                         |
| Notifikasi       | 5      | 2 welcome, 2 reminder, 1 custom (1 sent, 3 pending, 1 failed scenario)   |
| Audit Log        | 4      | LOGIN, CREATE (cron invoices), UPDATE (cron overdue), CREATE (complaint) |

### Referensi Kamar

| Kamar | Tipe     | Harga | Status       | Penghuni | Catatan                                            |
| ----- | -------- | ----- | ------------ | -------- | -------------------------------------------------- |
| A-01  | Standard | 500k  | Terisi       | Rina     | Sewa paling lama (~19 bln)                         |
| A-02  | Standard | 500k  | Terisi       | Rizky    | Rizky balik lagi setelah A-02→F-02→A-02 (3 leases) |
| A-03  | Standard | 550k  | Terisi       | Dimas    |                                                    |
| B-01  | Standard | 600k  | Terisi       | Siti     | Sewa berakhir bulan depan                          |
| B-02  | Standard | 600k  | Terisi       | Bayu     | Bayu sewa baru setelah F-02                        |
| B-03  | Standard | 650k  | Terisi       | Agus     |                                                    |
| C-01  | Premium  | 1M    | Terisi       | Dewi     | Kontrak panjang                                    |
| C-02  | Premium  | 1M    | Terisi       | Bambang  |                                                    |
| C-03  | Premium  | 1.2M  | Terisi       | Maya     |                                                    |
| D-01  | Standard | 750k  | Terisi       | Ahmad    | **Pindah dari A-02**                               |
| D-02  | Standard | 750k  | Terisi       | Intan    | **Belum verifikasi**                               |
| E-01  | Premium  | 1.5M  | Terisi       | Dian     | **Sewa ulang E-01** (2× lease)                     |
| E-02  | Premium  | 1.5M  | **Nonaktif** | —        |                                                    |
| F-01  | Standard | 800k  | Terisi       | Fajar    |                                                    |
| F-02  | Standard | 800k  | Terisi       | Citra    | Sewa ulang setelah gap                             |

### Referensi Penghuni (untuk testing)

| #   | Nama           | Kamar | Status          | Verifikasi | Catatan                           |
| --- | -------------- | ----- | --------------- | ---------- | --------------------------------- |
| 1   | Rina Wijaya    | A-01  | Aktif           | ✓          | Ada komplain open, invoice paid   |
| 2   | Dimas Saputra  | A-03  | Aktif           | ✓          | Ada komplain in_progress          |
| 3   | Siti Nurhaliza | B-01  | Aktif (end H+1) | ✓          | Overdue invoice, reminder notif   |
| 4   | Agus Pratama   | B-03  | Aktif           | ✓          | Invoice paid, custom notif        |
| 5   | Dewi Lestari   | C-01  | Aktif (end H+7) | ✓          | Ada komplain open, reminder notif |
| 6   | Bambang Susilo | C-02  | Aktif           | ✓          | Overdue invoice                   |
| 7   | Maya Anggraini | C-03  | Aktif           | ✓          | Invoice paid                      |
| 8   | Fajar Hidayat  | F-01  | Aktif           | ✓          | Chatbot message                   |
| 9   | Intan Permata  | D-02  | Aktif           | ✗          | **Belum verifikasi**              |
| 10  | Hendra Gunawan | D-01  | Selesai         | ✓          | Completed lease                   |
| 11  | Putri Ayu      | B-02  | Selesai         | ✓          | Completed lease                   |
| 12  | Adi Nugroho    | E-01  | Selesai         | ✓          | Completed lease                   |
| 13  | Ahmad Fauzi    | D-01  | Aktif           | ✓          | Pindah kamar (A-02→D-01)          |
| 14  | Dian Purnama   | E-01  | Aktif           | ✓          | Sewa ulang E-01                   |
| 15  | Bayu Segara    | B-02  | Aktif           | ✓          | Pindah F-02→B-02                  |
| 16  | Rizky Amalia   | A-02  | Aktif           | ✓          | 3× lease (A-02→F-02→A-02)         |
| 17  | Citra Kirana   | F-02  | Aktif           | ✓          | Sewa ulang F-02 setelah gap       |

---

## Membuat Data Tambahan untuk Testing

Beberapa skenario membutuhkan data tertentu yang tidak di-seed. Berikut cara membuatnya:

### Membuat Invoice (jika butuh lebih banyak)

```bash
sqlite3 packages/database/db.sqlite "
  INSERT INTO invoices (lease_id, amount, due_date, status) VALUES
    (1, 500000, strftime('%s','now','+1 month','start of month'), 'unpaid'),
    (2, 550000, strftime('%s','now','start of month'), 'unpaid'),
    (3, 600000, strftime('%s','now','-1 month','start of month'), 'unpaid');
"
```

### Membuat Komplain Tambahan

```bash
sqlite3 packages/database/db.sqlite "
  INSERT INTO complaints (tenant_id, description, status) VALUES
    (1, 'Atap bocor saat hujan', 'open'),
    (2, 'Kamar mandi mampet', 'in_progress'),
    (5, 'Tembok retak', 'resolved');
"
```

### Membuat Chatbot Message Tambahan

```bash
sqlite3 packages/database/db.sqlite "
  INSERT INTO chatbot_messages (tenant_id, direction, message, sent_at) VALUES
    (4, 'incoming', 'Saya mau perpanjang sewa', strftime('%s','now')),
    (4, 'outgoing', 'Silakan hubungi admin untuk perpanjangan kontrak.', strftime('%s','now'));
"
```

### Membuat Notifikasi Tambahan

```bash
sqlite3 packages/database/db.sqlite "
  INSERT INTO notifications (tenant_id, type, status) VALUES
    (1, 'payment_success', 'pending'),
    (2, 'custom', 'failed');
"
```

### Menandai Invoice Overdue via Scheduler Trigger

```bash
cd packages/scheduler
bun run trigger overdue $(date +%Y-%m-%d)
```

### Generate Payment Link (via dashboard)

- Login → Laporan Transaksi
- Klik **Generate** pada invoice unpaid
- Link akan terbuat via Duitku sandbox

### Kirim Notifikasi Kustom (via dashboard)

Login → Laporan Notifikasi → isi form kirim notifikasi → submit

---

## Test Cases

### 1. Login `/login`

| #   | Skenario    | Langkah              | Hasil                                        |
| --- | ----------- | -------------------- | -------------------------------------------- |
| 1.1 | Login admin | `admin` / `admin123` | Redirect ke dashboard, role admin            |
| 1.2 | Login staff | `staff` / `staff123` | Redirect ke dashboard, role staff            |
| 1.3 | Login owner | `owner` / `owner123` | Redirect ke dashboard, role owner            |
| 1.4 | Login gagal | wrong credentials    | Error "Username atau password tidak sesuai." |
| 1.5 | Logout      | Klik tombol logout   | Balik ke halaman login                       |

### 2. Dashboard `/dashboard`

> **Persiapan:** Jalankan seed.

| #   | Skenario                      | Cek                                                                                                                              |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Statistik benar               | Total Kamar 15 (14 Terisi, 0 Kosong), Penghuni Aktif 14, Tagihan: Rp2.850.000 (4 unpaid + 2 overdue = 6 belum), Komplain Aktif 3 |
| 2.2 | Tagihan Mendekati Jatuh Tempo | 4 invoice unpaid muncul di tabel (Dimas, Dewi, Intan, Rizky)                                                                     |
| 2.3 | Komplain Terbaru              | 3 komplain terbaru tampil (AC, lampu, kunci)                                                                                     |
| 2.4 | Navigasi "Lihat Semua"        | Klik "Lihat Semua" → `/dashboard/report/transactions`. Admin/owner lihat transaksi, staff lihat komplain                         |
| 2.5 | Role-based                    | Staff: link komplain muncul. Admin: link transaksi muncul. Owner: link transaksi muncul, tombol aksi tersembunyi                 |

### 3. Kelola Kamar `/dashboard/manage/rooms`

| #   | Skenario            | Cek                                                                                               |
| --- | ------------------- | ------------------------------------------------------------------------------------------------- |
| 3.1 | Daftar kamar (grid) | 15 kartu, tampil tipe (standard/premium), harga, status badge                                     |
| 3.2 | Filter status       | "Terisi" → 13 kamar. "Kosong" → 1 kamar (E-02 nonaktif tidak muncul). "Nonaktif" → 1 kamar (E-02) |
| 3.3 | Filter tipe         | "standard" → 10 kamar. "premium" → 5 kamar                                                        |
| 3.4 | Cari                | "A-01" → 1 kamar. "Kosong" → tidak ada hasil. "Rina" → A-01                                       |
| 3.5 | Detail kamar        | Klik "Detail" → modal, info kamar + **riwayat sewa** (lease history)                              |
| 3.6 | Tambah kamar        | Klik "Tambah Kamar" → isi form → submit → berhasil (hanya admin/staff)                            |
| 3.7 | Edit kamar          | Aksi → Edit → ubah harga/nomor/tipe → submit (hanya admin/staff)                                  |
| 3.8 | Hapus kamar         | Aksi → Hapus → konfirmasi → hilang. **Hanya kamar kosong**                                        |
| 3.9 | PDF                 | Klik tombol PDF → download file                                                                   |

**Edge case:**

- Tambah kamar dengan nomor yang sudah ada → error "Nomor kamar sudah terdaftar."
- Hapus kamar yang masih terisi → error "Kamar masih digunakan [nama tenant]."
- Edit nonaktifkan kamar yang terisi → toggle disabled (toggle tidak bisa dicentang)

### 4. Kelola Penghuni `/dashboard/manage/tenants`

| #   | Skenario                | Cek                                                                    |
| --- | ----------------------- | ---------------------------------------------------------------------- |
| 4.1 | Daftar penghuni (tabel) | 17 baris, avatar, nama, no HP, kamar, masa sewa, status badge          |
| 4.2 | Filter status           | "Aktif" → 14 baris. "Selesai" → 3 baris (Hendra, Putri, Adi)           |
| 4.3 | Cari                    | "Rina" → 1 hasil. Nomor HP → match. "A-01" → match dari nomor kamar    |
| 4.4 | Tombol WhatsApp         | Klik no HP → buka `wa.me/{phone}` di tab baru                          |
| 4.5 | Detail penghuni         | Klik "Detail" → modal, info lengkap + **riwayat sewa** (lease history) |
| 4.6 | Edit penghuni           | Aksi → Edit → ubah nama/asal → submit → data berubah                   |
| 4.7 | Tambah penghuni         | Klik "Tambah Penghuni" → isi form + pilih kamar kosong → submit        |

**Edge case:**

- Tambah penghuni dengan nomor HP yang sudah ada → error "Nomor HP sudah terdaftar."
- Tambah penghuni di kamar yang sudah terisi → error "Kamar sudah terisi."
- Intan Permata tampil dengan badge "Belum Verifikasi" (opacity 60%)

#### Aksi untuk Tenant Aktif (14 tenant)

| #   | Skenario          | Langkah                                                                                     |
| --- | ----------------- | ------------------------------------------------------------------------------------------- |
| 4.8 | Pindah kamar      | Aksi → Pindah Kamar → pilih kamar kosong → submit → lease baru aktif, lama nonaktif         |
| 4.9 | Berhenti Menginap | Aksi → Berhenti Menginap → konfirmasi → lease jadi nonaktif, tenant pindah ke tab "Selesai" |

#### Aksi untuk Tenant Selesai (3 tenant)

| #    | Skenario                | Langkah                                                                                                                     |
| ---- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 4.10 | Sewa Baru (re-register) | Aksi → Sewa Baru → pilih kamar kosong → submit → lease baru aktif. **Tidak bisa untuk tenant yang masih punya lease aktif** |

**Edge case:**

- Pindah kamar ke kamar yang sudah terisi → error "Kamar tujuan sudah terisi."
- Pindah tenant tanpa lease aktif → error "Penghuni tidak memiliki kontrak sewa aktif."
- Berhenti untuk tenant tanpa lease aktif → error "Penghuni tidak memiliki kontrak sewa aktif."
- Sewa baru untuk tenant yang masih punya lease aktif → error "Penghuni masih memiliki kontrak sewa aktif."
- Sewa baru ke kamar sudah terisi → error "Kamar sudah terisi."
- **Riwayat sewa**: Detail tenant menampilkan semua lease history (termasuk pindah/sewa ulang)

### 5. Daftar Komplain `/dashboard/manage/complaints`

| #   | Skenario        | Cek                                                                                 |
| --- | --------------- | ----------------------------------------------------------------------------------- |
| 5.1 | Daftar komplain | 4 komplain tampil, badge status, border kiri warna sesuai status                    |
| 5.2 | Filter status   | "Terbuka" → 2 open. "Proses" → 1 in_progress. "Selesai" → 1 resolved                |
| 5.3 | Filter tanggal  | "Dari" / "Sampai" → filter sesuai range createdAt                                   |
| 5.4 | Cari            | Cari kata kunci → filter hasil (cari "AC" → 1 hasil)                                |
| 5.5 | Tandai Selesai  | Open/In Progress → klik "Tandai Selesai" → isi catatan → submit → status resolved   |
| 5.6 | Lihat resolved  | Resolved complaint menampilkan catatan, penangani + waktu selesai, card opacity 65% |
| 5.7 | PDF             | Klik tombol PDF → download file                                                     |

### 6. Laporan Transaksi `/dashboard/report/transactions`

| #    | Skenario               | Cek                                                                                              |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| 6.1  | Statistik              | Total Pemasukan (sum paid), sudah terbayar (count), tertunggak (count + amount)                  |
| 6.2  | Daftar invoice (tabel) | 10 invoice, zebra stripe, status badge (lunas/hijau, unpaid/kuning, overdue/merah)               |
| 6.3  | Sort by lateness       | Overdue/unpaid lewat jatuh tempo di atas (sort by dueDate asc)                                   |
| 6.4  | Filter status          | "Lunas" → 4 paid. "Belum Bayar" → 4 unpaid. "Terlambat" → 2 overdue                              |
| 6.5  | Filter tanggal         | Pilih range → filter sesuai dueDate                                                              |
| 6.6  | Cari                   | Cari nama/kamar → filter (cari "Rina" → 1 hasil)                                                 |
| 6.7  | Generate Payment Link  | Invoice unpaid tanpa duitkuReference → klik "Generate" → response link terbentuk                 |
| 6.8  | Invoice page           | Klik "Invoice" → ke `/invoice/{id}` → lihat struk                                                |
| 6.9  | Tandai Lunas (manual)  | Invoice unpaid/overdue → menu → "Tandai Lunas" → status berubah, notif `payment_success` terbuat |
| 6.10 | Salin link             | Invoice setelah generate → menu → "Salin" → clipboard (jika sudah ada duitkuReference)           |
| 6.11 | PDF                    | Klik tombol PDF → download file                                                                  |

**Edge case:**

- Generate link pada invoice yang sudah lunas → error "Invoice sudah lunas."
- Tandai lunas invoice yang sudah lunas → error "Invoice sudah lunas."
- Generate link invoice tanpa nomor HP tenant → error (jika ada)

### 7. Halaman Invoice `/invoice/{id}`

| #   | Skenario          | Cek                                                                        |
| --- | ----------------- | -------------------------------------------------------------------------- |
| 7.1 | Invoice unpaid    | `/invoice/{id}` → status "MENUNGGU", badge kuning                          |
| 7.2 | Invoice paid      | Setelah "Tandai Lunas" → status "LUNAS", hijau, tampilkan tanggal bayar    |
| 7.3 | Invoice cancelled | Status code `resultCode=02` → badge merah "GAGAL"                          |
| 7.4 | Cetak PNG         | Klik "Cetak PNG" → download file gambar (via snapdom)                      |
| 7.5 | Link dashboard    | Klik "← Dashboard" jika login → kembali ke dashboard                       |
| 7.6 | Auto-polling      | Invoice unpaid → hx-trigger `every 5s` update status secara otomatis       |
| 7.7 | Duitku redirect   | Akses via `/api/duitku/redirect` dengan query params → redirect ke invoice |

### 8. Manajemen Notifikasi `/dashboard/report/notifications`

| #   | Skenario          | Cek                                                                               |
| --- | ----------------- | --------------------------------------------------------------------------------- |
| 8.1 | Daftar notifikasi | 5 notifikasi tampil (waktu, penghuni, tipe badge, status badge)                   |
| 8.2 | Filter tipe       | "Pengingat" → 2 reminder. "Selamat Datang" → 2 welcome. "Pesan Khusus" → 1 custom |
| 8.3 | Filter tanggal    | Default bulan ini. Ubah range → filter ulang                                      |
| 8.4 | Cari              | Cari nama tenant → filter (cari "Rina" → 1 hasil)                                 |
| 8.5 | PDF               | Klik tombol PDF → download file                                                   |

### 9. Audit Log `/dashboard/log/audit`

| #   | Skenario           | Cek                                                                               |
| --- | ------------------ | --------------------------------------------------------------------------------- |
| 9.1 | Daftar audit log   | 4 log tampil (waktu, pengguna, aksi badge, tabel, record ID, detail button)       |
| 9.2 | Filter aksi        | "LOGIN" → 1. "CREATE" → 2. "UPDATE" → 1                                           |
| 9.3 | Filter tanggal     | Ubah range → filter ulang                                                         |
| 9.4 | Cari               | Cari aksi/tabel/pengguna → filter                                                 |
| 9.5 | Toggle system logs | Centang "Tampilkan System" → log dari system/bot-wa muncul (3 system logs muncul) |
| 9.6 | Delete log         | Klik X → konfirmasi → log terhapus. **Hanya untuk yang punya akses edit**         |
| 9.7 | Detail kolom       | Klik icon detail → popup tampilkan isi JSON                                       |
| 9.8 | PDF                | Klik PDF → download                                                               |

### 10. Log Chatbot `/dashboard/log/chatbot`

| #    | Skenario          | Cek                                                              |
| ---- | ----------------- | ---------------------------------------------------------------- |
| 10.1 | Daftar percakapan | 6 pesan tampil (arah icon, isi pesan, tenant + kamar, waktu)     |
| 10.2 | Filter arah       | "Masuk" → 3 incoming. "Keluar" → 3 outgoing                      |
| 10.3 | Filter tanggal    | Ubah range → filter ulang                                        |
| 10.4 | Cari              | Cari kata kunci → filter hasil (cari "AC" → Rina)                |
| 10.5 | Delete message    | Klik X → konfirmasi → pesan terhapus. **Hanya untuk akses edit** |
| 10.6 | PDF               | Klik PDF → download                                              |

### 11. Manajemen Akun `/dashboard/manage/accounts`

| #    | Skenario             | Cek                                                                    |
| ---- | -------------------- | ---------------------------------------------------------------------- |
| 11.1 | Daftar akun          | 3 akun (admin, staff, owner) — system tidak tampil                     |
| 11.2 | Filter role          | "Admin" → 1. "Staff" → 1. "Owner" → 1                                  |
| 11.3 | Cari                 | Cari "staff" → 1 hasil                                                 |
| 11.4 | Tambah akun          | Klik "Tambah Akun" → isi form → submit → akun baru (hanya admin/staff) |
| 11.5 | Edit akun non-admin  | Klik Edit → ubah data → submit (hanya admin/staff)                     |
| 11.6 | Hapus akun non-admin | Klik Hapus → konfirmasi → akun hilang (hanya admin/staff)              |

**Edge case:**

- Edit/hapus admin **tidak ada tombol** (role admin tidak bisa diedit/dihapus dari panel)
- Tambah akun dengan username yang sudah ada → error "Username tidak tersedia."

### 12. API / Callback

Endpoint internal yang tidak tampil di UI tapi penting untuk integrasi.

| #    | Skenario                  | Langkah                                                                                            | Hasil                                            |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 12.1 | Duitku redirect           | `GET /api/duitku/redirect?merchantOrderId=INV-000001&resultCode=00&reference=REF123&amount=500000` | Redirect ke `/invoice/1` dengan query params     |
| 12.2 | Duitku callback sukses    | `POST /api/duitku/callback` dg form data valid + signature dan resultCode=00                       | Invoice status → paid, notif + audit log terbuat |
| 12.3 | Duitku callback invalid   | `POST /api/duitku/callback` dg signature salah                                                     | Response 400                                     |
| 12.4 | Duitku callback duplicate | Kirim callback 2× untuk invoice yg sama                                                            | Response 200 (skip, log "Duplicate callback")    |

### 13. Role-Based Access Control

| #    | Role  | Halaman                    | Bisa Edit? | Catatan                         |
| ---- | ----- | -------------------------- | ---------- | ------------------------------- |
| 13.1 | admin | Semua halaman              | Ya         | Full access                     |
| 13.2 | staff | Kamar, Penghuni, Komplain  | Ya         | Bisa tambah/edit/hapus          |
|      |       | Laporan, Log               | Tidak      | Hanya lihat + PDF               |
| 13.3 | owner | Halaman laporan & log saja | Tidak      | Hanya lihat (allowEdit = false) |

### 14. Fitur Umum (Semua Halaman)

| #    | Skenario          | Cek                                                  |
| ---- | ----------------- | ---------------------------------------------------- |
| 14.1 | Filter + Search   | Kombinasi filter dan search bekerja bersamaan        |
| 14.2 | Reset filter      | Klik link "reset" → filter kembali ke default        |
| 14.3 | HTMX partial load | Navigasi filter/search tidak full-reload, URL update |
| 14.4 | PDF download      | Tombol PDF di setiap halaman → file terdownload      |

### 15. Scheduler / Cron

| #    | Skenario         | Langkah                                                                  | Hasil                                                           |
| ---- | ---------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 15.1 | Generate Invoice | `bun run trigger invoice <date>`                                         | Invoice baru terbuat untuk lease aktif tanpa invoice bulan tsb  |
| 15.2 | Overdue Check    | `bun run trigger overdue <date>`                                         | Invoice unpaid dg dueDate ≤ date → status "overdue"             |
| 15.3 | Rent Reminder    | `bun run trigger reminder <date>` (butuh invoice unpaid due date 3 hari) | Notif "reminder" untuk tiap invoice yang memenuhi               |
| 15.4 | Cron Scheduler   | `bun run index` (berjalan terus, cron tiap jam 00:00 & 16:00 UTC)        | Invoice + reminder tiap jam 08:00 WITA, overdue tiap 00:00 WITA |

---

## Catatan Penting

1. **Halaman admin (dashboard) harus di-serve dulu** — `cd site && bun run dev`
2. **Role-based access**: beberapa tombol hanya muncul untuk user dengan `canEdit()` (admin/staff)
   - `admin`: semua aksi bisa
   - `staff`: bisa edit kamar, penghuni, komplain; tidak bisa edit transaksi/akun
   - `owner`: hanya bisa lihat (allowEdit=false)
3. **Refresh data**: beberapa halaman pakai HTMX partial refresh, beberapa perlu reload penuh
4. **Database SQLite**: letak di `packages/database/db.sqlite`. Seed `db:seed-blackbox` selalu reset dari awal, tidak perlu hapus manual
5. **Semua phone number = 62887435034436**: untuk WhatsApp testing link
6. **Scheduler** (`packages/scheduler`): trigger dengan `bun run trigger <task> <YYYY-MM-DD>`
   - `overdue` — tandai invoice unpaid yg lewat tgl tsb sebagai overdue
   - `reminder` — buat notifikasi pengingat untuk invoice unpaid due dalam 3 hari
   - `invoice` — generate invoice untuk bulan yg ditentukan
   - `index` — jalankan cron scheduler otomatis
7. **Duitku**: Callback endpoint Butuh apiKey dan merchantCode dari env (`DUITKU_API_KEY`, `DUITKU_MERCHANT_CODE`). Tanpa itu, callback tidak bisa di-test.
8. **Invoice page auto-polling**: h5x poll setiap 5s untuk update status, swap elemen `#payment-status`
