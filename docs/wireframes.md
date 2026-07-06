# 📄 Deskripsi Antarmuka Sistem Manajemen Kos

## A. Antarmuka Masukan (Input)

Halaman yang digunakan untuk mengelola data sistem.

<details>
<summary>1. Dashboard</summary>

![Dashboard](wireframe-v2/png/input/1-dashboard.png)

Ringkasan operasional kos: statistik kamar, penghuni aktif, tagihan belum bayar, dan komplain terbuka. Dilengkapi daftar tagihan mendekati jatuh tempo serta komplain terbaru.
</details>

<details>
<summary>2. Manajemen Akun</summary>

![Akun](wireframe-v2/png/input/2-akun.png)

Mengelola pengguna sistem (admin, staff, pemilik). Menampilkan ringkasan jumlah akun, tabel nama pengguna dan role, serta fitur tambah akun.
</details>

<details>
<summary>3. Manajemen Kamar</summary>

![Kamar](wireframe-v2/png/input/3-kamar.png)

Mengelola data kamar kos. Menampilkan jenis kamar, harga, status ketersediaan, ringkasan kamar terisi, tersedia, dan nonaktif, serta tombol tambah kamar.
</details>

<details>
<summary>4. Manajemen Penghuni</summary>

![Penghuni](wireframe-v2/png/input/4-penghuni.png)

Mendaftarkan dan mengelola data penghuni. Disertai ringkasan total penghuni, sewa aktif, terverifikasi, serta tabel nama, kontak, kamar, periode sewa, dan status.
</details>

<details>
<summary>5. Manajemen Komplain</summary>

![Komplain](wireframe-v2/png/input/5-komplain.png)

Mencatat dan memantau komplain penghuni. Setiap komplain memiliki status terbuka, diproses, atau selesai. Terdapat ringkasan jumlah komplain dan filter periode.
</details>

<details>
<summary>6. Transaksi</summary>

![Transaksi](wireframe-v2/png/input/6-transaksi.png)

Daftar transaksi pembayaran penghuni. Menampilkan invoice, penghuni, nominal, jatuh tempo, status. Ringkasan total pemasukan, sudah terbayar, dan pembayaran tertunggak.
</details>

<details>
<summary>7. Notifikasi</summary>

![Notifikasi](wireframe-v2/png/input/7-notifikasi.png)

Riwayat notifikasi yang dikirim ke penghuni. Mencakup waktu, penghuni tujuan, jenis, dan status terkirim. Ringkasan total notifikasi, terkirim, serta pending dan gagal.
</details>

<details>
<summary>8. Log Chatbot</summary>

![Chatbot](wireframe-v2/png/input/8-chatbot.png)

Riwayat percakapan chatbot dengan penghuni. Menampilkan waktu, penghuni, arah pesan (masuk/keluar), dan isi. Ringkasan total percakapan, pesan masuk, dan pesan keluar.
</details>

<details>
<summary>9. Audit Log</summary>

![Audit](wireframe-v2/png/input/9-audit.png)

Mencatat aktivitas pengguna pada sistem. Setiap log mencakup waktu, pengguna, jenis aksi, dan tabel yang diubah. Ringkasan total aktivitas, pengguna aktif, dan data dibuat.
</details>

<details>
<summary>10. Login</summary>

![Login](wireframe-v2/png/input/10-login.png)

Form masuk ke sistem dengan nama pengguna dan kata sandi. Menampilkan ikon rumah dan nama Indekos Ungu sebagai identitas aplikasi.
</details>

## B. Antarmuka Keluaran (Output)

Halaman laporan cetak dengan kop surat, statistik, tabel data, dan tanda tangan.

<details>
<summary>1. Laporan Penghuni</summary>

![Laporan Penghuni](wireframe-v2/png/output/1-laporan-penghuni.png)

Laporan daftar penghuni aktif. Statistik total penghuni, sewa aktif, terverifikasi. Kolom: nama, nomor HP, kamar, awal/akhir sewa, status.
</details>

<details>
<summary>2. Laporan Kamar</summary>

![Laporan Kamar](wireframe-v2/png/output/2-laporan-kamar.png)

Laporan data kamar. Statistik total, terisi, tersedia, nonaktif. Kolom: nomor kamar, jenis, harga, status, penghuni.
</details>

<details>
<summary>3. Laporan Komplain</summary>

![Laporan Komplain](wireframe-v2/png/output/3-laporan-komplain.png)

Laporan pengaduan penghuni. Statistik total komplain, terbuka, proses, selesai. Kolom: penghuni, kamar, deskripsi, status, tanggal lapor, ditangani, selesai.
</details>

<details>
<summary>4. Laporan Transaksi</summary>

![Laporan Transaksi](wireframe-v2/png/output/4-laporan-transaksi.png)

Laporan keuangan bulanan. Statistik total pemasukan, sudah terbayar, pembayaran tertunggak. Kolom: invoice, penghuni, kamar, nominal, jatuh tempo, status.
</details>

<details>
<summary>5. Laporan Notifikasi</summary>

![Laporan Notifikasi](wireframe-v2/png/output/5-laporan-notifikasi.png)

Ringkasan pengiriman notifikasi. Statistik total notifikasi, terkirim, pending dan gagal. Kolom: dibuat, dikirim, penghuni, invoice, jenis, status.
</details>

<details>
<summary>6. Log Chatbot</summary>

![Laporan Chatbot](wireframe-v2/png/output/6-laporan-chatbot.png)

Riwayat percakapan chatbot. Statistik total percakapan, pesan masuk, pesan keluar. Kolom: waktu, penghuni, kamar, arah pesan, isi.
</details>

<details>
<summary>7. Audit Log</summary>

![Laporan Audit](wireframe-v2/png/output/7-laporan-audit.png)

Laporan aktivitas sistem. Statistik total aktivitas, pengguna aktif, data dibuat. Kolom: waktu, pengguna, jenis aksi, tabel target, id record.
</details>

<details>
<summary>8. Invoice</summary>

![Invoice](wireframe-v2/png/output/8-invoice.png)

Tagihan pembayaran penghuni. Mencantumkan nomor invoice, periode tagihan, rincian biaya (sewa, listrik, air, kebersihan), total, dan instruksi pembayaran.
</details>
