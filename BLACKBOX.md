# Blackbox Testing — Indekos Ungu

Prosedur testing manual (blackbox) untuk memvalidasi semua fitur dashboard, invoice, dan aksi CRUD.

## Setup

### 1. Siapkan database

```bash
cd packages/database

# Buat/refresh database dari schema
bun run db:push

# Seed data master (users, kamar, penghuni, kontrak) — selalu fresh
bun run db:seed-blackbox
```

> **password default:** admin → `admin123`, staff → `staff123`, owner → `owner123`

### 2. Jalankan dev server

```bash
cd site
bun run dev
```

Buka `http://localhost:4321`

---

## Data Seed (sudah tersedia setelah seed)

| Entity       | Jumlah | Catatan                                                 |
| ------------ | ------ | ------------------------------------------------------- |
| Users        | 5      | admin, staff, owner, system, bot-wa                     |
| Kamar        | 15     | 14 terisi, 0 kosong, 1 nonaktif; 10 standard, 5 premium |
| Penghuni     | 17     | 14 aktif (9 single + 5 multi-lease)                     |
|              |        | 3 selesai sewa; 1 belum verifikasi                      |
|              |        | Multi: Ahmad pindah, Dian sewa ulang, Bayu ganti kamar, |
|              |        | Rizky 3× lease (balik ke A-02), Citra sewa ulang F-02   |
| Kontrak Sewa | 23     | 14 aktif (1 berakhir bulan depan), 9 selesai            |

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

---

## Membuat Data untuk Testing

Beberapa tabel data (Invoice, Komplain, Chatbot, Notifikasi, Audit Log) tidak disediakan seed karena bergantung pada interaksi sistem/aktor eksternal. Berikut cara membuat data tersebut secara mandiri untuk kebutuhan testing.

### Membuat Invoice

Invoice dihasilkan oleh scheduler secara otomatis tiap bulan. Untuk testing manual:

1. **Jalankan scheduler** untuk generate invoice bulanan:

   ```bash
   cd packages/scheduler
   bun run trigger overdue 2026-01-01  # generate invoice + overdue
   bun run trigger reminder 2026-06-27  # generate reminder notifikasi
   ```

   Tanggal bisa disesuaikan. `overdue` akan menandai invoice yang sudah lewat jatuh tempo.

2. **Alternatif: insert langsung via DB** untuk skenario spesifik:

   ```bash
   sqlite3 ../db.sqlite "
     INSERT INTO invoices (lease_id, amount, due_date, status) VALUES
       (1, 500000, strftime('%s','2026-07-01'), 'unpaid'),
       (2, 550000, strftime('%s','2026-06-01'), 'unpaid'),
       (3, 600000, strftime('%s','2026-05-01'), 'unpaid');
   "
   ```

   Lalu gunakan `bun run trigger overdue <date>` untuk menandai yang overdue.

3. **Generate Payment Link** dari halaman Laporan Transaksi:
   - Login → buka Laporan Transaksi
   - Klik "Generate" pada invoice unpaid → akan mengarah ke Duitku sandbox
   - Link bisa disalin via tombol "Salin"

4. **Tandai Lunas manual** dari halaman Laporan Transaksi:
   - Klik menu "⋮" → pilih "Tandai Lunas" → konfirmasi
   - Ini juga akan membuat notifikasi `payment_success`

### Membuat Komplain

Komplain datang dari penghuni via WhatsApp bot. Untuk testing:

1. **Insert langsung via DB** untuk semua status:

   ```bash
   sqlite3 ../db.sqlite "
     INSERT INTO complaints (tenant_id, description, status) VALUES
       (1, 'AC tidak dingin', 'open'),
       (2, 'Kunci pintu macet', 'open'),
       (3, 'Lampu mati', 'in_progress'),
       (4, 'Wi-Fi sering putus', 'resolved');
   "
   ```

2. **Test resolve komplain** dari halaman Daftar Komplain:
   - Filter status "Open" atau "Proses"
   - Klik "Tandai Selesai" → isi catatan → submit

### Membuat Chatbot Message

Pesan chatbot datang dari WhatsApp bot (incoming/outgoing). Untuk testing:

1. **Insert langsung via DB**:
   ```bash
   sqlite3 ../db.sqlite "
     INSERT INTO chatbot_messages (tenant_id, direction, message, sent_at) VALUES
       (1, 'incoming', 'Pak, kapan jatuh tempo?', strftime('%s','now')),
       (1, 'outgoing', 'Tagihan bulan ini jatuh tempo tanggal 1.', strftime('%s','now')),
       (2, 'incoming', 'Bisa bayar lewat QRIS?', strftime('%s','now')),
       (2, 'outgoing', 'Bisa! Link pembayaran akan dikirim.', strftime('%s','now'));
   "
   ```

### Membuat Notifikasi

Notifikasi dibuat otomatis oleh sistem. Untuk testing:

1. **`welcome`** → terbuat otomatis saat tambah penghuni (via aksi Tambah Penghuni di dashboard)
2. **`reminder`** → jalankan `bun run trigger reminder <date>` di packages/scheduler (perlu invoice yang due dalam 3 hari)
3. **`payment_success`** → terbuat saat gunakan aksi "Tandai Lunas"
4. **`custom`** → bisa dikirim dari halaman Laporan Notifikasi (cari aksi kirim yang tersedia)

### Membuat Audit Log

Audit log dibuat otomatis oleh semua aksi CRUD. Untuk testing:

1. **Lakukan aksi CRUD apapun** (tambah/hapus/edit kamar, penghuni, akun) — setiap aksi akan membuat audit log otomatis
2. **Login** juga membuat audit log (LOGIN action)

---

## Test Cases

### 1. Login

| #   | Skenario    | Langkah              | Hasil                                        |
| --- | ----------- | -------------------- | -------------------------------------------- |
| 1.1 | Login admin | `admin` / `admin123` | Redirect ke dashboard, role admin            |
| 1.2 | Login staff | `staff` / `staff123` | Redirect ke dashboard, role staff            |
| 1.3 | Login owner | `owner` / `owner123` | Redirect ke dashboard, role owner            |
| 1.4 | Login gagal | wrong credentials    | Error "Username atau password tidak sesuai." |
| 1.5 | Logout      | Klik tombol logout   | Balik ke halaman login                       |

### 2. Dashboard

> **Persiapan:** Jalankan seed terlebih dahulu.

| #   | Skenario                      | Cek                                                                                                            |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2.1 | Statistik benar               | Total Kamar 15 (14 terisi, 0 kosong, 1 nonaktif), Penghuni Aktif 14, Tagihan Belum Bayar 0, Komplain Terbuka 0 |
| 2.2 | Tagihan Mendekati Jatuh Tempo | Kosong (belum ada invoice)                                                                                     |
| 2.3 | Komplain Terbaru              | Kosong (belum ada komplain)                                                                                    |
| 2.4 | Navigasi                      | Klik "Lihat Semua" → /dashboard/report/transactions (admin/owner). Staff lihat "Kelola Komplain"               |
| 2.5 | Role-based                    | Staff: link komplain muncul. Admin: link transaksi muncul                                                      |

### 3. Kelola Kamar `/dashboard/manage/rooms`

| #   | Skenario            | Cek                                                                       |
| --- | ------------------- | ------------------------------------------------------------------------- |
| 3.1 | Daftar kamar (grid) | 15 kartu, tipe (standard/premium), harga, status (terisi/kosong/nonaktif) |
| 3.2 | Filter status       | "Terisi" → 9 kamar. "Kosong" → 5 kamar. "Nonaktif" → 1 kamar (E-02)       |
| 3.3 | Filter tipe         | "standard" → 10 kamar. "premium" → 5 kamar                                |
| 3.4 | Cari                | "A-01" → 1 kamar. "kosong" → tidak ada hasil                              |
| 3.5 | Detail kamar        | Klik "Detail" → modal, lihat informasi kamar + kosong (belum ada riwayat) |
| 3.6 | Tambah kamar        | Klik "Tambah Kamar" → isi form → submit → berhasil (operator/staff/admin) |
| 3.7 | Edit kamar          | Actions → Edit → ubah harga → submit                                      |
| 3.8 | Hapus kamar         | Actions → Hapus → konfirmasi → hilang dari daftar                         |
| 3.9 | PDF                 | Klik tombol PDF → download file                                           |

**Edge case:** Coba tambah kamar dengan nomor yang sudah ada → error "Nomor kamar sudah terdaftar."

### 4. Kelola Penghuni `/dashboard/manage/tenants`

| #   | Skenario                | Cek                                                              |
| --- | ----------------------- | ---------------------------------------------------------------- |
| 4.1 | Daftar penghuni (tabel) | 12 baris, avatar, nama, no HP, kamar, masa sewa, status          |
| 4.2 | Filter status           | "Aktif" → 14 baris. "Selesai" → 3 baris (Hendra, Putri, Adi)     |
| 4.3 | Cari                    | "Rina" → 1 hasil. "62887435034436" → Rina (yang pertama match)   |
| 4.4 | Tombol WhatsApp         | Klik no HP → buka wa.me/{phone} di tab baru                      |
| 4.5 | Detail penghuni         | Klik "Detail" → modal, info lengkap + kosong (belum ada riwayat) |
| 4.6 | Edit penghuni           | Actions → Edit → ubah nama/asal → submit → data berubah          |
| 4.7 | Tambah penghuni         | Klik "Tambah Penghuni" → isi form + pilih kamar → submit         |

**Edge case:**

- Tambah penghuni dengan nomor HP yang sudah ada (walau beda tenant) → error "Nomor HP sudah terdaftar."
- Tambah penghuni di kamar yang sudah terisi → error "Kamar sudah terisi."
- Intan Permata tampil dengan badge "Belum Verifikasi" (opacity 60%)

#### Aksi untuk Tenant Aktif (9 tenant)

| #   | Skenario          | Langkah                                                                                        |
| --- | ----------------- | ---------------------------------------------------------------------------------------------- |
| 4.8 | Pindah kamar      | Actions → Pindah Kamar → pilih kamar kosong → submit → lease baru aktif, lama nonaktif         |
| 4.9 | Berhenti Menginap | Actions → Berhenti Menginap → konfirmasi → lease jadi nonaktif, tenant pindah ke tab "Selesai" |

#### Aksi untuk Tenant Selesai (3 tenant)

| #    | Skenario                | Langkah                                                                                                                        |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 4.10 | Sewa Baru (re-register) | Actions → Sewa Baru → pilih kamar kosong → submit → lease baru aktif. **Tidak bisa untuk tenant yang masih punya lease aktif** |

**Edge case pindah kamar:**

- Pindah ke kamar yang sudah terisi → error "Kamar tujuan sudah terisi."
- Pindah tenant yang tidak memiliki lease aktif → error.

**Edge case berhenti:**

- Tenant tanpa lease aktif → error "Penghuni tidak memiliki kontrak sewa aktif."

**Edge case sewa baru:**

- Tenant yang masih punya lease aktif → error "Penghuni masih memiliki kontrak sewa aktif."
- Kamar yang sudah terisi → error "Kamar sudah terisi."

### 5. Daftar Komplain `/dashboard/manage/complaints`

> **Persiapan:** Buat komplain dulu dengan insert langsung ke DB (lihat bagian "Membuat Komplain" di atas).

| #   | Skenario        | Cek                                                                               |
| --- | --------------- | --------------------------------------------------------------------------------- |
| 5.1 | Daftar komplain | Menampilkan komplain yang sudah dibuat, badge status, border kiri sesuai status   |
| 5.2 | Filter status   | "Open" → komplain open. "Proses" → komplain in_progress. "Selesai" → resolved     |
| 5.3 | Filter tanggal  | "Dari" / "Sampai" → filter sesuai range createdAt                                 |
| 5.4 | Cari            | Cari kata kunci → filter hasil                                                    |
| 5.5 | Tandai Selesai  | Open/In Progress → klik "Tandai Selesai" → isi catatan → submit → status resolved |
| 5.6 | Lihat resolved  | Resolved complaint menampilkan catatan, penangani + waktu selesai                 |
| 5.7 | PDF             | Klik tombol PDF → download file                                                   |

### 6. Laporan Transaksi `/dashboard/report/transactions`

> **Persiapan:** Buat invoice dulu dengan scheduler atau insert langsung ke DB (lihat bagian "Membuat Invoice" di atas).

| #    | Skenario               | Cek                                                                                                         |
| ---- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| 6.1  | Statistik              | Total pemasukan (sum paid), sudah terbayar (count), tertunggak (count)                                      |
| 6.2  | Daftar invoice (tabel) | Menampilkan invoice yang sudah dibuat, zebra stripe, status badge                                           |
| 6.3  | Sort by lateness       | Overdue/unpaid lewat jatuh tempo di atas                                                                    |
| 6.4  | Filter status          | Lunas → paid. Belum Bayar → unpaid. Terlambat → overdue                                                     |
| 6.5  | Filter tanggal         | Pilih range → filter sesuai dueDate                                                                         |
| 6.6  | Cari                   | Cari nama/kamar → filter                                                                                    |
| 6.7  | Generate Payment Link  | Invoice unpaid tanpa duitkuReference → klik "Generate" → link terbuat, tombol berubah jadi "Invoice" + menu |
| 6.8  | Invoice page           | Klik "Invoice" → ke `/invoice/{id}` → lihat struk                                                           |
| 6.9  | Tandai Lunas (manual)  | Invoice unpaid/overdue → menu → "Tandai Lunas" → status berubah                                             |
| 6.10 | Salin link             | Invoice dengan duitkuReference → menu → "Salin" → clipboard                                                 |

**Edge case:**

- Generate link pada invoice yang sudah lunas → error "Invoice sudah lunas."
- Tandai lunas invoice yang sudah lunas → error "Invoice sudah lunas."

### 7. Halaman Invoice `/invoice/{id}`

> **Persiapan:** Butuh invoice yang sudah ada (dari langkah sebelumnya).

| #   | Skenario       | Cek                                                                     |
| --- | -------------- | ----------------------------------------------------------------------- |
| 7.1 | Invoice unpaid | `/invoice/{id}` → status "MENUNGGU", badge kuning                       |
| 7.2 | Invoice paid   | Setelah "Tandai Lunas" → status "LUNAS", hijau, tampilkan tanggal bayar |
| 7.3 | Cetak PNG      | Klik "Cetak PNG" → download file gambar                                 |
| 7.4 | Link dashboard | Klik "← Dashboard" jika login → kembali ke dashboard                    |
| 7.5 | Auto-polling   | Invoice unpaid → h5x poll setiap 5 detik update status                  |

### 8. Manajemen Notifikasi `/dashboard/report/notifications`

> **Persiapan:** Notifikasi terbuat dari beberapa sumber (lihat bagian "Membuat Notifikasi" di atas). Jalankan `bun run trigger reminder` untuk membuat reminder, atau lakukan "Tandai Lunas" untuk membuat payment_success.

| #   | Skenario          | Cek                                                                                         |
| --- | ----------------- | ------------------------------------------------------------------------------------------- |
| 8.1 | Daftar notifikasi | Menampilkan notifikasi yang sudah ada, semua kolom (waktu, penghuni, invoice, tipe, status) |
| 8.2 | Filter tipe       | Filter per tipe: reminder, payment_success, welcome, custom                                 |
| 8.3 | Filter tanggal    | Default bulan ini. Ubah range → filter ulang                                                |
| 8.4 | Cari              | Cari nama tenant → filter                                                                   |

### 9. Audit Log `/dashboard/log/audit`

> **Persiapan:** Audit log dibuat otomatis oleh semua aksi CRUD. Lakukan beberapa aksi dulu (tambah/edit kamar, tambah penghuni, login/logout) untuk mengisi log.

| #   | Skenario           | Cek                                                                            |
| --- | ------------------ | ------------------------------------------------------------------------------ |
| 9.1 | Daftar audit log   | Menampilkan log yang ada, waktu, pengguna, aksi, tabel, record ID, detail JSON |
| 9.2 | Filter aksi        | Filter per tipe: CREATE, UPDATE, DELETE, REJECT, LOGIN                         |
| 9.3 | Filter tanggal     | Ubah range → filter ulang                                                      |
| 9.4 | Cari               | Cari aksi/tabel/pengguna → filter                                              |
| 9.5 | Toggle system logs | Centang "Tampilkan System" → log dari system/bot-wa muncul                     |
| 9.6 | Delete log         | Klik X → konfirmasi → log terhapus. **Hanya untuk yang punya akses edit**      |
| 9.7 | Detail kolom       | Klik detail → popup isi JSON                                                   |
| 9.8 | PDF                | Klik PDF → download                                                            |

### 10. Log Chatbot `/dashboard/log/chatbot`

> **Persiapan:** Insert pesan chatbot via DB (lihat bagian "Membuat Chatbot Message" di atas).

| #    | Skenario          | Cek                                                                                   |
| ---- | ----------------- | ------------------------------------------------------------------------------------- |
| 10.1 | Daftar percakapan | Menampilkan pesan yang sudah diinsert, arah (masuk/keluar), isi pesan, tenant + kamar |
| 10.2 | Filter arah       | Masuk → incoming. Keluar → outgoing                                                   |
| 10.3 | Filter tanggal    | Ubah range → filter ulang                                                             |
| 10.4 | Cari              | Cari kata kunci → filter hasil                                                        |
| 10.5 | Delete message    | Klik X → konfirmasi → pesan terhapus. **Hanya untuk akses edit**                      |
| 10.6 | PDF               | Klik PDF → download                                                                   |

### 11. Manajemen Akun `/dashboard/manage/accounts`

| #    | Skenario             | Cek                                                |
| ---- | -------------------- | -------------------------------------------------- |
| 11.1 | Daftar akun          | 3 akun (admin, staff, owner) — system tidak tampil |
| 11.2 | Filter role          | Admin → 1. Staff → 1. Owner → 1                    |
| 11.3 | Cari                 | Cari "staff" → 1 hasil                             |
| 11.4 | Tambah akun          | Klik "Tambah Akun" → isi form → submit → akun baru |
| 11.5 | Edit akun non-admin  | Klik Edit → ubah data → submit                     |
| 11.6 | Hapus akun non-admin | Klik Hapus → konfirmasi → akun hilang              |

**Edge case:**

- Edit/hapus admin **tidak ada tombol** (role admin tidak bisa diedit/dihapus dari panel)
- Tambah akun dengan username yang sudah ada → error "Username tidak tersedia."

---

## Catatan Penting

1. **Halaman admin (dashboard) harus di-serve dulu** — `cd site && bun run dev`
2. **Role-based access**: beberapa tombol hanya muncul untuk user dengan `canEdit()` (admin/staff/owner tergantung halaman)
3. **Refresh data**: beberapa halaman pakai HTMX partial refresh, beberapa perlu reload penuh
4. **Database SQLite**: letak di `packages/database/db.sqlite`. Seed `db:seed-blackbox` selalu reset dari awal, tidak perlu hapus manual
5. **Semua phone number = 62887435034436**: untuk WhatsApp testing link
6. **Scheduler** (`packages/scheduler`): Jalankan `bun run trigger overdue <date>` untuk menandai invoice overdue, atau `bun run trigger reminder <date>` untuk generate reminder notification. Tanggal format YYYY-MM-DD (WITA, UTC+8)
