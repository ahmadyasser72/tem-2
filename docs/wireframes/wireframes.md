# 📄 Deskripsi Antarmuka Sistem Manajemen Kos

## 🧾 A. Antarmuka Masukan (Input)

Rancangan masukan sistem merupakan bagian yang menjelaskan bagaimana data dimasukkan ke dalam sistem oleh pengguna. Antarmuka masukan dirancang agar mudah digunakan, jelas, dan meminimalkan kesalahan dalam pengisian data. Setiap elemen input seperti field, tombol, dan pilihan disusun secara terstruktur agar pengguna dapat memahami alur pengisian dengan cepat.

Selain itu, rancangan antarmuka masukan disusun berdasarkan rancangan model sistem dan rancangan basis data yang telah dibuat sebelumnya. Hal ini bertujuan agar setiap data yang dimasukkan sesuai dengan struktur dan kebutuhan sistem, sehingga proses pengolahan data dapat berjalan dengan baik dan terintegrasi.

<details>
<summary>1. Halaman Login</summary>

![Login](./screenshots/in/page-login.png.webp)

Halaman login digunakan untuk masuk ke dalam sistem. Terdapat dua input utama yaitu username dan password, serta tombol masuk. Pengguna harus mengisi data dengan benar agar dapat mengakses sistem.

</details>

---

<details>
<summary>2. Halaman Dashboard</summary>

![Dashboard](./screenshots/in/page-dashboard.png.webp)

Halaman dashboard menampilkan ringkasan kondisi sistem seperti jumlah kamar, penghuni aktif, tagihan, dan komplain. Selain itu, terdapat informasi tambahan seperti tagihan yang mendekati jatuh tempo dan komplain terbaru.

</details>

---

<details>
<summary>3. Halaman Manajemen Akun</summary>

![Akun](./screenshots/in/page-akun.png.webp)

Halaman ini menampilkan daftar akun pengguna dalam bentuk tabel. Informasi yang ditampilkan meliputi username, role, dan aktivitas terakhir. Pengguna dapat mengelola data akun melalui halaman ini.

</details>

---

<details>
<summary>4. Halaman Manajemen Kamar</summary>

![Kamar](./screenshots/in/page-kamar.png.webp)

Halaman ini menampilkan data kamar dalam bentuk kartu. Setiap kamar memiliki informasi seperti nomor kamar, jenis kamar, harga, dan status. Halaman ini digunakan untuk melihat dan mengelola kamar.

</details>

---

<details>
<summary>5. Halaman Manajemen Penghuni</summary>

![Penghuni](./screenshots/in/page-penghuni.png.webp)

Halaman ini berisi daftar penghuni dalam bentuk tabel. Data yang ditampilkan meliputi nama, nomor HP, kamar, masa sewa, dan status. Digunakan untuk mengelola data penghuni kos.

</details>

---

<details>
<summary>6. Halaman Transaksi</summary>

![Transaksi](./screenshots/in/page-transaksi.png.webp)

Halaman ini digunakan untuk melihat data transaksi pembayaran. Terdapat filter periode untuk menampilkan data sesuai waktu tertentu, serta tabel berisi detail transaksi.

</details>

---

<details>
<summary>7. Halaman Notifikasi</summary>

![Notifikasi](./screenshots/in/page-pengingat.png.webp)

Halaman ini menampilkan daftar notifikasi (pengingat, pembayaran sukses, dan pesan kustom). Digunakan untuk mengelola komunikasi dengan penghuni melalui chatbot.

</details>

---

<details>
<summary>8. Halaman Komplain</summary>

![Komplain](./screenshots/in/page-komplain.png.webp)

Halaman ini menampilkan daftar komplain dari penghuni. Informasi yang ditampilkan meliputi isi komplain dan status penanganannya.

</details>

---

<details>
<summary>9. Halaman Log Chatbot</summary>

![Log Chatbot](./screenshots/in/page-log-chatbot.png.webp)

Halaman ini menampilkan riwayat percakapan antara pengguna dan chatbot. Data ditampilkan dalam bentuk daftar pesan yang dapat digunakan untuk monitoring interaksi.

</details>

---

<details>
<summary>10. Halaman Audit Log</summary>

![Audit Log](./screenshots/in/page-audit-log.png.webp)

Halaman ini berisi riwayat aktivitas pengguna dalam sistem. Informasi yang ditampilkan meliputi waktu, aksi, dan data yang terlibat.

</details>

---

## 📊 B. Antarmuka Keluaran (Output)

Rancangan keluaran sistem menjelaskan bagaimana informasi yang telah diolah oleh sistem disajikan kepada pengguna. Antarmuka keluaran dirancang dalam bentuk laporan dan tampilan data yang mudah dibaca, sehingga pengguna dapat memahami informasi dengan cepat tanpa memerlukan analisis yang kompleks.

Selain itu, rancangan antarmuka keluaran juga dibuat berdasarkan rancangan model sistem dan rancangan basis data yang telah dirancang sebelumnya. Dengan demikian, informasi yang ditampilkan sesuai dengan data yang tersimpan dalam sistem dan dapat mendukung kebutuhan pengguna dalam melakukan pemantauan serta pengambilan keputusan.

<details>
<summary>1. Laporan Transaksi</summary>

![Laporan](./screenshots/out/page-laporan.png.webp)

Rancangan keluaran ini menampilkan ringkasan transaksi pembayaran kos dalam periode tertentu yang mencakup total pemasukan, jumlah tagihan lunas dan belum lunas, serta tingkat pelunasan, disertai tabel detail berisi nomor invoice, nama penghuni, kamar, nominal, tanggal jatuh tempo, tanggal bayar, status, dan referensi transaksi yang dapat dicetak sebagai laporan administrasi.

</details>

---

<details>
<summary>2. Struk Invoice</summary>

![Invoice](./screenshots/out/page-invoice.png.webp)

Rancangan keluaran ini berupa bukti pembayaran digital yang menampilkan informasi invoice seperti nomor, tanggal terbit, jatuh tempo, data penghuni, rincian biaya, total pembayaran, metode pembayaran, tanggal transaksi, serta status pembayaran sehingga dapat digunakan sebagai bukti sah pembayaran.

</details>

---

<details>
<summary>3. Laporan Audit Log</summary>

![Lap Audit](./screenshots/out/page-lap-audit.png.webp)

Rancangan keluaran ini menyajikan data aktivitas pengguna dalam sistem berdasarkan periode tertentu yang mencakup nama pengguna, peran, serta tabel log berisi waktu aktivitas, jenis aksi, nama tabel yang diakses, dan ID data untuk keperluan monitoring dan keamanan sistem.

</details>

---

<details>
<summary>4. Laporan Interaksi Chatbot</summary>

![Chatbot](./screenshots/out/page-lap-chatbot-msg.png.webp)

Rancangan keluaran ini menampilkan riwayat komunikasi antara penghuni dan chatbot dalam periode tertentu yang mencakup identitas penghuni serta tabel berisi waktu pesan, arah pesan (masuk atau keluar), dan isi pesan untuk evaluasi layanan komunikasi.

</details>

---

<details>
<summary>5. Daftar Penghuni</summary>

![Daftar Penghuni](./screenshots/out/page-daftar-penghuni.png.webp)

Rancangan keluaran ini berisi daftar penghuni yang masih aktif menempati kamar kos dengan informasi seperti nama lengkap, nomor telepon, kamar, tanggal mulai dan selesai sewa, dilengkapi total penghuni serta area tanda tangan sebagai validasi laporan.

</details>

---

<details>
<summary>6. Rekap Kamar</summary>

![Rekap Kamar](./screenshots/out/page-rekap-kamar.png.webp)

Rancangan keluaran ini menyajikan ringkasan kondisi kamar kos yang mencakup jumlah total kamar, kamar terisi, tersedia, dan nonaktif, serta tabel detail setiap kamar berisi nomor kamar, jenis, harga, status, penghuni, dan akhir masa sewa untuk memantau ketersediaan kamar.

</details>

---

<details>
<summary>7. Laporan Komplain</summary>

![Komplain](./screenshots/out/page-lap-komplain.png.webp)

Rancangan keluaran ini menampilkan data komplain penghuni dalam periode tertentu yang mencakup jumlah komplain berdasarkan status serta tabel detail berisi nama penghuni, kamar, deskripsi masalah, tanggal pengajuan, status, dan pihak yang menangani untuk evaluasi pelayanan.

</details>

---

<details>
<summary>8. Laporan Pengingat</summary>

![Pengingat](./screenshots/out/page-lap-pengingat.png.webp)

Rancangan keluaran ini berisi riwayat pengiriman notifikasi tagihan kepada penghuni yang mencakup jumlah notifikasi terkirim, otomatis, manual, dan gagal, serta tabel detail berisi waktu kirim, penghuni, nomor invoice, jenis pengingat, dan status pengiriman.

</details>

---

<details>
<summary>9. Rekap Tagihan</summary>

![Tagihan](./screenshots/out/page-rekap-tagihan.png.webp)

Rancangan keluaran ini menyajikan riwayat tagihan tiap penghuni yang mencakup identitas penghuni serta tabel berisi nomor invoice, periode, nominal, jatuh tempo, tanggal bayar, dan status, dilengkapi total keseluruhan tagihan sebagai ringkasan.

</details>
