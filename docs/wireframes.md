# 📄 Deskripsi Antarmuka Sistem Manajemen Kos

## A. Antarmuka Masukan (Input)

Halaman yang digunakan pengguna untuk memasukkan dan mengelola data sistem.

<details>
<summary>1. Halaman Login</summary>

![Login](wireframe-v2/png/input/login.png)

Form masuk ke sistem dengan username dan password. Menampilkan logo Indekos Ungu sebagai identitas.
</details>

<details>
<summary>2. Halaman Dashboard</summary>

![Dashboard](wireframe-v2/png/input/dashboard.png)

Ringkasan kondisi kos melalui kartu statistik (kamar terisi, penghuni, tagihan, komplain) serta daftar tagihan jatuh tempo dan komplain terbaru untuk pemantauan cepat.
</details>

<details>
<summary>3. Halaman Manajemen Penghuni</summary>

![Penghuni](wireframe-v2/png/input/penghuni.png)

Mendaftarkan dan mengelola data penghuni kos. Dilengkapi pencarian, ringkasan jumlah penghuni (aktif/selesai/tunggakan), serta tabel berisi nama, kontak, kamar, periode sewa, dan status.
</details>

<details>
<summary>4. Halaman Manajemen Kamar</summary>

![Kamar](wireframe-v2/png/input/kamar.png)

Mengelola data kamar kos. Menampilkan jenis kamar, harga sewa, status ketersediaan, ringkasan kamar terisi dan kosong, serta tombol tambah kamar baru.
</details>

<details>
<summary>5. Halaman Manajemen Akun</summary>

![Akun](wireframe-v2/png/input/akun.png)

Mengelola pengguna sistem seperti admin, staff, dan pemilik kos. Terdapat ringkasan jumlah akun berdasarkan status dan tabel nama pengguna, email, role.
</details>

<details>
<summary>6. Halaman Komplain</summary>

![Komplain](wireframe-v2/png/input/komplain.png)

Mencatat dan memantau komplain dari penghuni. Setiap komplain ditampilkan dalam kartu dengan status terbuka, diproses, atau selesai. Terdapat filter periode dan ringkasan jumlah komplain.
</details>

<details>
<summary>7. Halaman Log Chatbot</summary>

![Log Chatbot](wireframe-v2/png/input/chatbot.png)

Riwayat percakapan antara chatbot dan penghuni. Menampilkan waktu, nama penghuni, dan arah pesan (masuk/keluar). Dilengkapi filter periode dan ringkasan statistik percakapan.
</details>

<details>
<summary>8. Halaman Audit Log</summary>

![Audit Log](wireframe-v2/png/input/audit.png)

Mencatat aktivitas pengguna di dalam sistem. Setiap log mencakup waktu, pengguna, jenis aksi, dan tabel yang diubah. Terdapat filter berdasarkan periode dan jenis aksi.
</details>

<details>
<summary>9. Halaman Transaksi</summary>

![Transaksi](wireframe-v2/png/input/transaksi.png)

Daftar transaksi pembayaran penghuni. Menampilkan nomor invoice, penghuni, nominal, jatuh tempo, status pembayaran, dan referensi gateway. Ringkasan statistik total tagihan, lunas, dan tertunggak.
</details>

<details>
<summary>10. Halaman Notifikasi</summary>

![Notifikasi](wireframe-v2/png/input/notifikasi.png)

Riwayat notifikasi yang telah dikirim ke penghuni. Mencakup waktu pengiriman, penghuni tujuan, jenis notifikasi, dan status terkirim atau gagal. Dilengkapi filter periode.
</details>

## B. Antarmuka Keluaran (Output)

Halaman yang menyajikan data dalam bentuk cetak atau laporan.

<details>
<summary>1. Laporan Transaksi Bulanan</summary>

![Laporan Transaksi](wireframe-v2/png/output/laporan-transaksi.png)

Laporan keuangan bulanan mencakup total tagihan, jumlah invoice lunas, belum lunas, dan tertunggak. Dilengkapi kop surat dan tanda tangan.
</details>

<details>
<summary>2. Laporan Riwayat Notifikasi</summary>

![Laporan Notifikasi](wireframe-v2/png/output/laporan-notifikasi.png)

Ringkasan pengiriman notifikasi dalam periode tertentu. Menampilkan total kirim, terkirim, gagal, dan rincian per penghuni.
</details>

<details>
<summary>3. Daftar Penghuni Aktif</summary>

![Laporan Penghuni](wireframe-v2/png/output/laporan-penghuni.png)

Daftar penghuni yang masih aktif beserta nomor kamar, kontak, dan periode sewa. Digunakan untuk pendataan dan arsip.
</details>

<details>
<summary>4. Rekap Status Kamar</summary>

![Laporan Kamar](wireframe-v2/png/output/laporan-kamar.png)

Rekapitulasi seluruh kamar kos meliputi nomor kamar, jenis, harga sewa, status terisi atau kosong, dan penghuni saat ini.
</details>

<details>
<summary>5. Laporan Komplain Penghuni</summary>

![Laporan Komplain](wireframe-v2/png/output/laporan-komplain.png)

Laporan komplain yang masuk dari penghuni dalam periode tertentu. Mencakup deskripsi, status penanganan, dan tanggal penyelesaian.
</details>

<details>
<summary>6. Laporan Percakapan Chatbot</summary>

![Laporan Chatbot](wireframe-v2/png/output/laporan-chatbot.png)

Riwayat percakapan chatbot dengan penghuni dalam format cetak. Menampilkan waktu, penghuni, arah pesan, dan isi pesan.
</details>

<details>
<summary>7. Laporan Aktivitas Pengguna</summary>

![Laporan Audit](wireframe-v2/png/output/laporan-audit.png)

Log aktivitas pengguna sistem dalam periode tertentu. Mencakup waktu, pengguna, jenis aksi, dan objek yang diubah.
</details>

<details>
<summary>8. Invoice / Struk Pembayaran</summary>

![Invoice](wireframe-v2/png/output/invoice.png)

Struk digital pembayaran sewa kos. Menampilkan informasi invoice, rincian biaya, status pembayaran, dan kop surat Indekos Ungu. Tersedia dua varian status: lunas dan menunggu.
</details>
