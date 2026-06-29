# API Reference

## Pendahuluan

Duitku membuat proses integrasi semudah mungkin. Memungkinkan halaman pembayaran Duitku tampil di halaman _web_/aplikasi anda setelah _checkout_, dengan proses integrasi yang sangat mudah. Serahkan pembayaran anda pada Duitku Pop. Memberikan opsional pembayaran dan konfirmasi pembayaran yang di lakukan oleh _customer_ pada halaman anda. Hanya dengan anda memunculkan Duitku pop di halaman anda.

## Pratinjau

> 1.  Pelanggan melakukan _checkout_ pembayaran.
> 2.  Server _merchant_ melakukan _request_ transaksi ke API Duitku untuk mendapatkan DUITKU_REFERENCE.
> 3.  API Duitku merespon request dengan memberikan DUITKU_REFERENCE.
> 4.  Server _merchant_ menampilkan halaman pembayaran pada situs mereka untuk ditampilkan pada pelanggan.
> 5.  Pelanggan memverifikasi detail transaksi dan klik tombol pembayaran. Sistem _merchant_ memanggil fungsi checkout.process(DUITKU_REFERENCE, options).
> 6.  Sistem pembayaran Duitku memproses transaksi dan merespon status pembayaran. Duitku JS lalu melakukan _callback_ yang telah disediakan di sisi _merchant_.
> 7.  Sistem pembayaran Duitku memberikan notifikasi status transaksi pada _server merchant_.

Sorry, your browser doesn't support embedded videos.

## Langkah Integrasi

![Flowchart pop](images/flowchart-pop-5905d358.jpg)

Untuk menghubungkan dengan API Duitku, ada beberapa hal yang perlu diketahui sebagai berikut.

### Kode _Merchant_

Kode _merchant_ adalah kode proyek yang didapatkan dari halaman _merchant_ Duitku. Kode ini berguna sebagai pengenal proyek anda di setiap transaksinya nanti. Kode ini bisa anda dapatkan pada setiap proyek yang anda daftarkan di [_merchant_ portal](https://passport.duitku.com/merchant/Project). Langkah atau cara pembuatan proyek dapat anda lihat [disini](https://docs.duitku.com/account#integrasi-akun--mendapatkan-api-key).

### API _Key_ (_Merchant Key_)

API merupakan singkatan dari _Application Programming Interface_. API _key_ disini adalah kode otentikasi untuk dapat mengakses API Duitku. API _key_ digunakan untuk mencegah penyalahgunaan atau pengguna berbahaya. Seperti kode _merchant_, API _key_ bisa anda dapatkan pada setiap proyek yang anda daftarkan di [_merchant_ portal](https://passport.duitku.com/merchant/Project) bersamaan dengan kode _merchant_.

## Flowchart

### Membuat Invoice atau Transaction

![Flowchart create invoice](images/flowchart-create-invoice-724f2935.png)

### Menampilkan Payment Page

![Flowchart display payment page](images/flowchart-display-payment-page-790266ed.png)

### Proses Pembayaran (Flow ini hanya berdasarkan user journey Duitku)

![Flowchart payment process](images/flowchart-payment-process-89e37bea.png)

### Callback (Notifikasi Pembayaran)

![Flowchart callback](images/flowchart-callback-2041a809.png)

## _Browser_ Yang Kompatibel

| Platform | Browser           | Versi           |
| -------- | ----------------- | --------------- |
| Web      | Chrome            | 26 dan terbaru  |
|          | Firefox           | 29 dan terbaru  |
|          | Internet Explorer | 10 dan terbaru  |
|          | Safari            | 6 dan terbaru   |
| Mobile   | Chrome            | 32 dan terbaru  |
|          | Android           | 4.4 dan terbaru |
|          | Safari            | 8 dan terbaru   |

## Library

Anda dapat mengintegrasikan menggunakan _Library_ Duitku untuk memulai transaksi menggunakan Duitku pada _web_ atau aplikasi anda. _Library_ akan membantu anda pada saat integrasi dengan Duitku. Untuk mengenal lebih lanjut anda dapat melihat _Library_ Duitku pada _package repository_ masing-masing _library_ yang telah tersedia berikut ini.

[![](images/composer-fce820ad.png)](https://packagist.org/packages/duitkupg/duitku-php) [![](images/npm-7d1dc9cd.png)](https://www.npmjs.com/package/duitku)

## Integrasi _Backend_ atau _Server_

Tujuan dari Integrasi _Backend_ adalah untuk mendapat `DUITKU_REFERENCE` dengan mengirimkan informasi pembayaran yang dibutuhkan. Kami menyediakan HTTP API untuk melakukannya.

## _Create Invoice_

API _Create Invoice_ digunakan untuk mendapatkan nomor referensi Duitku dengan mengirimkan parameter yang dibutuhkan ke API. _Merchant_ akan mendapatkan nomor referensi Duitku, URL pembayaran, dan lainnya dari respon API _Create Invoice_.

### _Endpoint_

Method: `HTTP POST`

Type : `application/json`

Production: `https://api-prod.duitku.com/api/merchant/createInvoice`

Sandbox: `https://api-sandbox.duitku.com/api/merchant/createInvoice`

Otentikasi dasar yang digunakan Duitku adalah _signature_, _timestamp_, dan _merchant code_ yang di kirim pada bagian _header_. Untuk membuat HTTP _request_, _merchant_ harus menyertakan _header_ seperti berikut:

- Parameter: Content-Type
  - Tipe: string
  - Wajib: ✓
  - Deskripsi: String yang menunjukkan jenis media.
  - Contoh: application/json
- Parameter: x-duitku-timestamp
  - Tipe: string
  - Wajib: ✓
  - Deskripsi: Timestamp adalah timestamp UNIX dalam milidetik dalam zona waktu kami (Jakarta). Timestamp UNIX adalah cara untuk melacak waktu sebagai total detik yang berjalan.
  - Contoh: 1773728479616
- Parameter: x-duitku-signature
  - Tipe: string
  - Wajib: ✓
  - Deskripsi: Signature adalah kode identifikasi transaksi. Berisi parameter transaksi yang menggunakan metode HMAC SHA256. Parameter yang berisi hash adalah merchant code, timestamp, kemudian API key dan harus berurutan. Formula: stringToSign = merchantCode + timestamp signature = HMAC_SHA256(stringToSign, apiKey)
  - Contoh: f40731428e7c3669bed8669b660afa4ef619754af46dfb2ad58b3ce223209bcf
- Parameter: x-duitku-merchantcode
  - Tipe: string
  - Wajib: ✓
  - Deskripsi: Merchant code adalah ID proyek yang telah dibuat dan didaftarkan di halaman merchant Duitku.
  - Contoh: DXXXX

### _Request_ Parameter

```
{
    "paymentAmount": 40000,
    "merchantOrderId": "1648542419",
    "productDetails": "Test Pay with duitku",
    "additionalParam": "",
    "merchantUserInfo": "",
    "paymentMethod":"",
    "customerVaName": "John Doe",
    "email": "[email protected]",
    "phoneNumber": "08123456789",
    "itemDetails": [{
        "name": "Test Item 1",
        "price": 10000,
        "quantity": 1
    }, {
        "name": "Test Item 2",
        "price": 30000,
        "quantity": 3
    }],
    "customerDetail": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "[email protected]",
        "phoneNumber": "08123456789",
        "merchantCustomerId": "",
        "billingAddress": {
            "firstName": "John",
            "lastName": "Doe",
            "address": "Jl. Kembangan Raya",
            "city": "Jakarta",
            "postalCode": "11530",
            "phone": "08123456789",
            "countryCode": "ID"
        },
        "shippingAddress": {
            "firstName": "John",
            "lastName": "Doe",
            "address": "Jl. Kembangan Raya",
            "city": "Jakarta",
            "postalCode": "11530",
            "phone": "08123456789",
            "countryCode": "ID"
        }
    },
    "creditCardDetail": {
        "saveCardToken": 0
    },
    "callbackUrl": "https:\/\/example.com\/api-pop\/backend\/callback.php",
    "returnUrl": "https:\/\/example.com\/api-pop\/backend\/redirect.php",
    "expiryPeriod": 10
}

```

```
<?php
    $merchantCode = 'DXXXX'; // dari duitku
    $merchantKey = 'XXXXXXXCX17XXXX5XX5XXXXXX0X3XXAF'; // dari duitku

    $timestamp = round(microtime(true) * 1000); //in milisecond
    $paymentAmount = 40000;
    $merchantOrderId = time() . ''; // dari merchant, unique
    $productDetails = 'Test Pay with duitku';
    $email = '[email protected]'; // email pelanggan merchant
    $phoneNumber = '08123456789'; // nomor tlp pelanggan merchant (opsional)
    $additionalParam = ''; // opsional
    $merchantUserInfo = ''; // opsional
    $customerVaName = 'John Doe'; // menampilkan nama pelanggan pada tampilan konfirmasi bank
    $callbackUrl = 'http://example.com/api-pop/backend/callback.php'; // url untuk callback
    $returnUrl = 'http://example.com/api-pop/backend/redirect.php';//'http://example.com/return'; // url untuk redirect
    $expiryPeriod = 10; // untuk menentukan waktu kedaluarsa dalam menit

    $stringToSign = $merchantCode . $timestamp;

    // Generate HMAC SHA256 (output hex lowercase)
    $signature = hash_hmac('sha256', $stringToSign, $merchantKey);

    //$paymentMethod = 'VC'; //digunakan untuk direksional pembayaran

    // Detail pelanggan
    $firstName = "John";
    $lastName = "Doe";

    // Detail Alamat
    $alamat = "Jl. Kembangan Raya";
    $city = "Jakarta";
    $postalCode = "11530";
    $countryCode = "ID";

    // Khusus untuk pembayaran tokenisasi
    // $merchantCustomerId = "your_merchant_customer_id";
    // $saveCardToken = 1; //

    $address = array(
        'firstName' => $firstName,
        'lastName' => $lastName,
        'address' => $alamat,
        'city' => $city,
        'postalCode' => $postalCode,
        'phone' => $phoneNumber,
        'countryCode' => $countryCode
    );

    $customerDetail = array(
       'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'phoneNumber' => $phoneNumber,
        //'merchantCustomerId' => $merchantCustomerId,
        'billingAddress' => $address,
        'shippingAddress' => $address
    );


    $item1 = array(
        'name' => 'Test Item 1',
        'price' => 10000,
        'quantity' => 1);

    $item2 = array(
        'name' => 'Test Item 2',
        'price' => 30000,
        'quantity' => 3);

    $itemDetails = array(
        $item1, $item2
    );

    /*Khusus untuk metode pembayaran Kartu Kredit
    $creditCardDetail = array (
        'saveCardToken' => $saveCardToken,
        'acquirer' => '014',
        'binWhitelist' => array (
            '014',
            '400000'
        )
    );*/

    $params = array(
        'paymentAmount' => $paymentAmount,
        'merchantOrderId' => $merchantOrderId,
        'productDetails' => $productDetails,
        'additionalParam' => $additionalParam,
        'merchantUserInfo' => $merchantUserInfo,
        'customerVaName' => $customerVaName,
        'email' => $email,
        'phoneNumber' => $phoneNumber,
        'itemDetails' => $itemDetails,
        'customerDetail' => $customerDetail,
        //'creditCardDetail' => $creditCardDetail,
        'callbackUrl' => $callbackUrl,
        'returnUrl' => $returnUrl,
        'expiryPeriod' => $expiryPeriod
        //'paymentMethod' => $paymentMethod
    );

    $params_string = json_encode($params);
    //echo $params_string;
    $url = 'https://api-sandbox.duitku.com/api/merchant/createinvoice'; // Sandbox
    // $url = 'https://api-prod.duitku.com/api/merchant/createinvoice'; // Production

    //log transaksi untuk debug
    // file_put_contents('log_createInvoice.txt', "* log *\r\n", FILE_APPEND | LOCK_EX);
    // file_put_contents('log_createInvoice.txt', $params_string . "\r\n\r\n", FILE_APPEND | LOCK_EX);
    // file_put_contents('log_createInvoice.txt', 'x-duitku-signature:' . $signature . "\r\n\r\n", FILE_APPEND | LOCK_EX);
    // file_put_contents('log_createInvoice.txt', 'x-duitku-timestamp:' . $timestamp . "\r\n\r\n", FILE_APPEND | LOCK_EX);
    // file_put_contents('log_createInvoice.txt', 'x-duitku-merchantcode:' . $merchantCode . "\r\n\r\n", FILE_APPEND | LOCK_EX);
    $ch = curl_init();


    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $params_string);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Content-Length: ' . strlen($params_string),
        'x-duitku-signature:' . $signature ,
        'x-duitku-timestamp:' . $timestamp ,
        'x-duitku-merchantcode:' . $merchantCode
        )
    );
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);

    //execute post
    $request = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if($httpCode == 200)
    {
        $result = json_decode($request, true);
        //header('location: '. $result['paymentUrl']);
        print_r($result, false);
        // echo "paymentUrl :". $result['paymentUrl'] . "<br />";
        // echo "reference :". $result['reference'] . "<br />";
        // echo "statusCode :". $result['statusCode'] . "<br />";
        // echo "statusMessage :". $result['statusMessage'] . "<br />";
    }
    else
    {
        // echo $httpCode . " " . $request ;
        echo $request ;
    }
?>

```

```
curl --location --request POST 'https://api-sandbox.duitku.com/api/merchant/createInvoice' \
--header 'x-duitku-signature: f40731428e7c3669bed8669b660afa4ef619754af46dfb2ad58b3ce223209bcf' \
--header 'x-duitku-timestamp: 1629219840000' \
--header 'x-duitku-merchantcode: DXXXX' \
--header 'Content-Type: application/json' \
--data-raw
{
   "paymentAmount":40000,
   "merchantOrderId":"1579838431",
   "productDetails":"Test Pay with duitku",
   "additionalParam":"",
   "merchantUserInfo":"",
   "paymentMethod":"",
   "customerVaName":"John Doe",
   "email":"[email protected]",
   "phoneNumber":"08123456789",
   "itemDetails":[
      {
         "name":"Test Item 1",
         "price":10000,
         "quantity":1
      },
      {
         "name":"Test Item 2",
         "price":30000,
         "quantity":3
      }
   ],
   "customerDetail":{
      "firstName":"John",
      "lastName":"Doe",
      "email":"[email protected]",
      "phoneNumber":"08123456789",
      "billingAddress":{
         "firstName":"John",
         "lastName":"Doe",
         "address":"Jl. Kembangan Raya",
         "city":"Jakarta",
         "postalCode":"11530",
         "phone":"08123456789",
         "countryCode":"ID"
      },
      "shippingAddress":{
         "firstName":"John",
         "lastName":"Doe",
         "address":"Jl. Kembangan Raya",
         "city":"Jakarta",
         "postalCode":"11530",
         "phone":"08123456789",
         "countryCode":"ID"
      },
      "merchantCustomerId":""
   },
   "creditCardDetail": {
        "saveCardToken": 0
   },
   "callbackUrl":"http:\/\/example.com\/api-pop\/backend\/callback.php",
   "returnUrl":"http:\/\/example.com\/api-pop\/backend\/redirect.php",
   "expiryPeriod":10
}

```

- Parameter: paymentAmount
  - Tipe: integer
  - Wajib: ✓
  - Deskripsi: Nominal pembayaran.
  - Contoh: 150000
- Parameter: merchantOrderId
  - Tipe: string(50)
  - Wajib: ✓
  - Deskripsi: Order ID dari merchant.
  - Contoh: abcde12345
- Parameter: productDetails
  - Tipe: string(255)
  - Wajib: ✓
  - Deskripsi: Detail produk.
  - Contoh: Pembayaran untuk Toko Contoh
- Parameter: email
  - Tipe: string(255)
  - Wajib: ✓
  - Deskripsi: Email pelanggan merchant.
  - Contoh: [email protected]
- Parameter: additionalParam
  - Tipe: string(255)
  - Wajib: ✗
  - Deskripsi: Parameter tambahan (opsional).
  - Contoh:
- Parameter: merchantUserInfo
  - Tipe: string(255)
  - Wajib: ✗
  - Deskripsi: Username atau email pelanggan (opsional).
  - Contoh: [email protected]
- Parameter: customerVaName
  - Tipe: string(20)
  - Wajib: ✗
  - Deskripsi: Nama yang akan muncul pada halaman konfirmasi pembayaran.
  - Contoh: John Doe
- Parameter: phoneNumber
  - Tipe: string(50)
  - Wajib: ✗
  - Deskripsi: Nomor telepon pelanggan (opsional).
  - Contoh: 08123456789
- Parameter: itemDetails
  - Tipe: itemDetails
  - Wajib: ✗
  - Deskripsi: Informasi detail barang (opsional).
  - Contoh:
- Parameter: customerDetail
  - Tipe: customerDetail
  - Wajib: ✗
  - Deskripsi: Informasi detail pelanggan (opsional).
  - Contoh:
- Parameter: callbackUrl
  - Tipe: string(255)
  - Wajib: ✓
  - Deskripsi: URL untuk transaksi callback.
  - Contoh: http://example.com/api-pop/backend/callback.php
- Parameter: returnUrl
  - Tipe: string(255)
  - Wajib: ✓
  - Deskripsi: URL untuk redirect apabila transaksi telah selesai atau dibatalkan.
  - Contoh: http://example.com/api-pop/backend/redirect.php
- Parameter: expiryPeriod
  - Tipe: integer
  - Wajib: ✗
  - Deskripsi: Masa berlaku transaksi sebelum kedaluarsa.
  - Contoh: 5, 10 or 60 (dalam menit)
- Parameter: paymentMethod
  - Tipe: string
  - Wajib: ✗
  - Deskripsi: Payment Method adalah sebuah kode metode pembayaran.
  - Contoh: VC
- Parameter: creditCardDetail
  - Tipe: creditCardDetail
  - Wajib: ✗
  - Deskripsi: Detail parameter untuk pembayaran kartu kredit (opsional).
  - Contoh:

Duitku menggunakan `merchantCode` dan `apiKey` untuk memberi akses API. Anda dapat membuat `merchantCode` pada [_Merchant Portal_](https://passport.duitku.com/merchant/Project/).

### Respon Parameter

```
{
    "merchantCode": "DXXXX",
    "reference": "DXXXXS875LXXXX32IJZ7",
    "paymentUrl": "https://app-sandbox.duitku.com/redirect_checkout?reference=DXXXXS875LXXXX32IJZ7",
    "statusCode": "00",
    "statusMessage": "SUCCESS"
}

```

- Parameter: merchantCode
  - Tipe: string
  - Deskripsi: Merchant code dari Duitku.
  - Contoh: DXXXX
- Parameter: reference
  - Tipe: string
  - Deskripsi: Referensi dari Duitku (perlu disimpan pada system).
  - Contoh: DXXXXS875LXXXX32IJZ7
- Parameter: paymentUrl
  - Tipe: string
  - Deskripsi: URL pembayaran jika anda ingin menggunakan halaman pembayaran Duitku.
  - Contoh: https://app-sandbox.duitku.com/redirect_checkout?reference=DXXXXS875LXXXX32IJZ7
- Parameter: statusCode
  - Tipe: string
  - Deskripsi: Respon kode status.
  - Contoh: 00
- Parameter: statusMessage
  - Tipe: string
  - Deskripsi: Respon status.
  - Contoh: Success

## Obyek JSON

Koleksi obyek JSON.

### _Item Details_

```
"itemDetails": [{
    "name": "Apel",
    "quantity": 2,
    "price": 50000
}]

```

| Parameter | Tipe       | Wajib | Deskripsi                                                       | Contoh |
| --------- | ---------- | ----- | --------------------------------------------------------------- | ------ |
| name      | string(50) | ✓     | Nama barang.                                                    | Apel   |
| quantity  | integer    | ✓     | Banyaknya barang.                                               | 2      |
| price     | integer    | ✓     | Harga barang. Catatan: Tidak diperkenankan menggunakan desimal. | 50000  |

### _Customer Detail_

```
"customerDetail": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "[email protected]",
    "phoneNumber": "081234567890",
    "billingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "St Panjang",
      "city": "Jakarta",
      "postalCode": "41011",
      "phone": "081234567890",
      "countryCode": "ID"
    },
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "St Panjang",
      "city": "Jakarta",
      "postalCode": "41011",
      "phone": "081234567890",
      "countryCode": "ID"
    },
    "merchantCustomerId": "id_customer"
}

```

- Parameter: firstName
  - Tipe: string(50)
  - Wajib: ✗
  - Deskripsi: Nama depan pelanggan.
  - Contoh: John
- Parameter: lastName
  - Tipe: string(50)
  - Wajib: ✗
  - Deskripsi: Nama belakang pelanggan.
  - Contoh: Doe
- Parameter: email
  - Tipe: string(50)
  - Wajib: ✗
  - Deskripsi: Email pelanggan.
  - Contoh: [email protected]
- Parameter: phoneNumber
  - Tipe: string(50)
  - Wajib: ✗
  - Deskripsi: Nomor telepon pelanggan.
  - Contoh: 081234567890
- Parameter: billingAddress
  - Tipe: Address
  - Wajib: ✗
  - Deskripsi: Alamat tagihan pelanggan.
  - Contoh:
- Parameter: shippingAddress
  - Tipe: Address
  - Wajib: ✗
  - Deskripsi: Alamat pengiriman pelanggan.
  - Contoh:
- Parameter: merchantCustomerId
  - Tipe: String(100)
  - Wajib: ✗
  - Deskripsi: ID unik pelanggan milik merchant, wajib untuk fitur tokenisasi.
  - Contoh: id_customer

### Address

```
{
  "firstName": "John",
  "lastName": "Doe",
  "address": "St Panjang",
  "city": "Jakarta",
  "postalCode": "41011",
  "phone": "081234567890",
  "countryCode": "ID"
}

```

| Parameter   | Tipe       | Wajib | Deskripsi                                    | Contoh       |
| ----------- | ---------- | ----- | -------------------------------------------- | ------------ |
| firstName   | string(50) | ✗     | Nama depan pelanggan.                        | John         |
| lastName    | string(50) | ✗     | Nama belakang pelanggan.                     | Doe          |
| address     | string(50) | ✗     | Alamat tagihan atau pengiriman.              | St Panjang   |
| city        | string(50) | ✗     | Kota pada alamat.                            | Jakarta      |
| postalCode  | string(50) | ✗     | Kode pos alamat.                             | 41011        |
| phone       | string(50) | ✗     | Nomor telepon untuk pengiriman atau tagihan. | 081234567890 |
| countryCode | string(50) | ✗     | ISO 3166-1 alpha-3.                          | ID           |

### _Credit Card Detail_

Berikut ini adalah parameter tambahan untuk request transaksi menggunakan channel kartu kredit bersifat opsional.

```
"creditCardDetail": {
  "saveCardToken" : 1,
  "acquirer":"014",
  "binWhitelist":["014","022", "400000"]
}

```

- Parameter: saveCardToken
  - Tipe: int(1)
  - Wajib: ✗
  - Keterangan: Parameter ini menentukan jenis token yang akan dibuat: • 1 – Menghasilkan token kartu kredit untuk transaksi 3-D Secure (3DS). Gunakan opsi ini ketika token dibutuhkan khusus untuk proses pembayaran yang aman dan memerlukan autentikasi pemegang kartu. • 2 – Menghasilkan token kartu kredit yang ditujukan untuk transaksi berulang atau otomatis, seperti penagihan langganan. Gunakan opsi ini ketika token perlu mendukung transaksi di masa depan tanpa autentikasi tambahan dari pemegang kartu.
  - Contoh: 2
- Parameter: acquirer
  - Tipe: string(3)
  - Wajib: ✗
  - Keterangan: Anda dapat menentukan acquirer bank yang akan digunakan pada transaksi yang akan dilakukan. • 014 untuk BCA. • 022 untuk CIMB.
  - Contoh: 014
- Parameter: binWhitelist
  - Tipe: array string(6)
  - Wajib: ✗
  - Keterangan: Parameter untuk membatasi kartu kredit yang diizinkan pada transaksi. Menggunakan kode bank(3 digit) atau nomor bin kartu kredit(6 digit). Maksimal 25 list bin.
  - Contoh: 014, 022, 400000

## _Callback_

```
<?php
    $apiKey = 'XXXXXXXCX17XXXX5XX5XXXXXX0X3XXAF'; // API key anda
    $merchantCode = isset($_POST['merchantCode']) ? $_POST['merchantCode'] : null;
    $amount = isset($_POST['amount']) ? $_POST['amount'] : null;
    $merchantOrderId = isset($_POST['merchantOrderId']) ? $_POST['merchantOrderId'] : null;
    $productDetail = isset($_POST['productDetail']) ? $_POST['productDetail'] : null;
    $additionalParam = isset($_POST['additionalParam']) ? $_POST['additionalParam'] : null;
    $paymentCode = isset($_POST['paymentCode']) ? $_POST['paymentCode'] : null;
    $resultCode = isset($_POST['resultCode']) ? $_POST['resultCode'] : null;
    $merchantUserId = isset($_POST['merchantUserId']) ? $_POST['merchantUserId'] : null;
    $reference = isset($_POST['reference']) ? $_POST['reference'] : null;
    $signature = isset($_POST['signature']) ? $_POST['signature'] : null;
    $publisherOrderId = isset($_POST['publisherOrderId']) ? $_POST['publisherOrderId'] : null;
    $spUserHash = isset($_POST['spUserHash']) ? $_POST['spUserHash'] : null;
    $settlementDate = isset($_POST['settlementDate']) ? $_POST['settlementDate'] : null;
    $issuerCode = isset($_POST['issuerCode']) ? $_POST['issuerCode'] : null;
    $bankAppCode = isset($_POST['bankAppCode']) ? $_POST['bankAppCode'] : null;
    $bankOrderId = isset($_POST['bankOrderId']) ? $_POST['bankOrderId'] : null;
    $bankRespCode = isset($_POST['bankRespCode']) ? $_POST['bankRespCode'] : null;
    $bankRespMsg = isset($_POST['bankRespMsg']) ? $_POST['bankRespMsg'] : null;
    $cardName = isset($_POST['cardName']) ? $_POST['cardName'] : null;
    $cardType = isset($_POST['cardType']) ? $_POST['cardType'] : null;
    $maskedNumber = isset($_POST['maskedNumber']) ? $_POST['maskedNumber'] : null;
    $tokenId = isset($_POST['tokenId']) ? $_POST['tokenId'] : null;
    $transactionState = isset($_POST['transactionState']) ? $_POST['transactionState'] : null;
    $transactionStateStatus = isset($_POST['transactionStateStatus']) ? $_POST['transactionStateStatus'] : null;
    $merchantCustomerId = isset($_POST['merchantCustomerId']) ? $_POST['merchantCustomerId'] : null;
    $expiryDate = isset($_POST['expiryDate']) ? $_POST['expiryDate'] : null;

    //log callback untuk debug
    // file_put_contents('callback.txt', "* Callback *\r\n", FILE_APPEND | LOCK_EX);

    if(!empty($merchantCode) && !empty($amount) && !empty($merchantOrderId) && !empty($signature))
    {
        // Generate signature
        $stringToSign = $merchantCode . $amount . $merchantOrderId;
        $calcSignature = hash_hmac('sha256', $stringToSign, $apiKey);

        if($signature == $calcSignature)
        {
            //Callback tervalidasi
            //Silahkan rubah status transaksi anda disini
            // file_put_contents('callback.txt', "* Berhasil *\r\n\r\n", FILE_APPEND | LOCK_EX);

        }
        else
        {
            // file_put_contents('callback.txt', "* Bad Signature *\r\n\r\n", FILE_APPEND | LOCK_EX);
            throw new Exception('Bad Signature');
        }
    }
    else
    {
        // file_put_contents('callback.txt', "* Bad Parameter *\r\n\r\n", FILE_APPEND | LOCK_EX);
        throw new Exception('Bad Parameter');
    }
?>

```

```
curl --location --request POST 'http://example.com/api-pop/backend/callback.php' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'merchantOrderId=abcde12345' \
--data-urlencode 'amount=150000' \
--data-urlencode 'merchantCode=DXXXX' \
--data-urlencode 'productDetails=Pembayaran untuk Toko Contoh' \
--data-urlencode 'additionalParam=contoh param' \
--data-urlencode 'paymentCode=VA' \
--data-urlencode 'resultCode=00' \
--data-urlencode '[email protected]' \
--data-urlencode 'reference=DXXXXCX80TXXX5Q70QCI' \
--data-urlencode 'signature=d842db69f70501fe69487b3d957611c2d4e47335f390a5895b0a762a1bf1f1a0'\
--data-urlencode 'publisherOrderId=MGUHWKJX3M1KMSQN5'\
--data-urlencode 'spUserHash=xxxyyyzzz'\
--data-urlencode 'settlementDate=2023-07-25'\
--data-urlencode 'issuerCode=93600523'\
--data-urlencode 'customerName=Bam**** Maul***'\
--data-urlencode 'bankAppCode=571996' \
--data-urlencode 'bankOrderId=30000001409' \
--data-urlencode 'bankRespCode=00' \
--data-urlencode 'bankRespMsg=Approved' \
--data-urlencode 'cardName=John Doe' \
--data-urlencode 'cardType=Master Card' \
--data-urlencode 'maskedNumber=557781xxxxxx0004' \
--data-urlencode 'tokenId=7bd2XXX119ab4645abcdXXXa63b119b2'\
--data-urlencode 'transactionState=AUTHORIZED' \
--data-urlencode 'transactionStateStatus=Success' \
--data-urlencode 'merchantCustomerId=id_customer' \
--data-urlencode 'expiryDate=05/28' \

```

Pada saat pelanggan melakukan pembayaran. Duitku akan mengirimkan HTTP POST yang menyertakan hasil pembayaran suatu tagihan dari pelanggan. Merchant perlu menyediakan halaman untuk menerima callback tersebut. Supaya dapat memproses hasil transaksi yang telah dilakukan oleh pelanggan.

### Parameter

Method : `HTTP POST`

Type : `x-www-form-urlencoded`

- Parameter: merchantCode
  - Deskripsi: merchant code dari Duitku.
  - Contoh: D0010
- Parameter: amount
  - Deskripsi: Nominal pembayaran.
  - Contoh: 150000
- Parameter: merchantOrderId
  - Deskripsi: Order ID dari merchant.
  - Contoh: abcde12345
- Parameter: productDetail
  - Deskripsi: Detail produk.
  - Contoh: Pembayaran untuk Toko Contoh
- Parameter: additionalParam
  - Deskripsi: Parameter tambahan (opsional).
  - Contoh:
- Parameter: paymentCode
  - Deskripsi: Metode pembayaran.
  - Contoh: VC
- Parameter: resultCode
  - Deskripsi: Status pembayaran.
  - Contoh: 00 - Success 01 - Failed
- Parameter: merchantUserId
  - Deskripsi: User ID dari merchant.
  - Contoh: [email protected]
- Parameter: reference
  - Deskripsi: Nomor referensi dari Duitku, harap disimpan untuk melakukan pengecekan transaksi.
  - Contoh: DXXXXS875LXXXX32IJZ7
- Parameter: signature
  - Deskripsi: Kode identifikasi transaksi. Berisikan parameter keamanan sebagai acuan bahwa request yang diterima berasal dari server Duitku. Signature dihasilkan menggunakan metode HMAC SHA256. Formula: stringToSign = merchantcode + amount + merchantOrderId signature = HMAC_SHA256(stringToSign, merchantKey)
  - Contoh: f40731428e7c3669bed8669b660afa4ef619754af46dfb2ad58b3ce223209bcf
- Parameter: publisherOrderId
  - Deskripsi: Nomor unik pembayaran transaksi dari Duitku. Mohon disimpan untuk keperluan pencatatan atau pelacakan transaksi.
  - Contoh: MGUHWKJX3M1KMSQN5
- Parameter: spUserHash
  - Deskripsi: Akan dikirimkan melalui callback jika metode pembayaran menggunakan ShopeePay(QRIS, App, and Account Link). Jika, nilai parameter berikut ini mengandung alphabet dan numeric. Maka, kemungkinan telah dibayarkan menggunakan Shopee.
  - Contoh: xxxyyyzzz
- Parameter: settlementDate
  - Deskripsi: Informasi waktu estimasi penyelesaian. Format: YYYY-MM-DD
  - Contoh: 2023-07-25
- Parameter: issuerCode
  - Deskripsi: Informasi kode issuer dari QRIS.lihat daftar issuer disini.
  - Contoh: 93600523
- Parameter: customerName
  - Deskripsi: Pengidentifikasi akun issuer QRIS. Tergantung pada issuer-nya, nilainya dapat berupa nama akun atau nomor telepon. Nilai yang dikembalikan mungkin sebagian disembunyikan.
  - Contoh: Bam\***_ Maul_**
- Parameter: bankAppCode
  - Deskripsi: Authorization ID dari bank.
  - Contoh: 571996
- Parameter: bankOrderId
  - Deskripsi: Order ID transaksi pembayaran yang teregistrasi pada sisi bank.
  - Contoh: 571996
- Parameter: bankRespCode
  - Deskripsi: Kode respon dari bank.
  - Contoh: 00
- Parameter: bankRespMsg
  - Deskripsi: Pesan respon dari bank.
  - Contoh: Approved
- Parameter: cardName
  - Deskripsi: Nama pemilik kartu kredit.
  - Contoh: John Doe
- Parameter: cardType
  - Deskripsi: Jenis kartu kredit yang di gunakan oleh pelanggan.
  - Contoh: Master Card
- Parameter: maskedNumber
  - Deskripsi: Nomor kartu yang di sensor. Dapat di gunakan untuk memberikan informasi kartu yang di gunakan oleh pelanggan ke palanggan tersebut.
  - Contoh: 557781xxxxxx0004
- Parameter: tokenId
  - Deskripsi: Token untuk identifikasi. Dapat digunakan sebagai pengganti data kartu kredit untuk transaksi selanjutnya sehingga Anda tidak perlu memberikan data kartu apapun.
  - Contoh: 7bd2XXX119ab4645abcdXXXa63b119b2
- Parameter: transactionState
  - Deskripsi: kondisi dari proses transaksi yang telah dilakukan merchant saat ini.
  - Contoh: AUTHORIZED
- Parameter: transactionStateStatus
  - Deskripsi: Informasi dari status TransactionState yang telah dilakukan saat ini. • Success• Failed
  - Contoh: Success
- Parameter: merchantCustomerId
  - Deskripsi: Id unik pelanggan milik merchant
  - Contoh: id_customer
- Parameter: expiryDate
  - Deskripsi: Waktu kedaluwarsa kartu
  - Contoh: 05/28

## Integrasi _Frontend_ atau _View_

## Tinjauan Umum

Tujuan dari Integrasi _Frontend_ adalah untuk menampilkan halaman pembayaran Duitku di dalam situs _merchant_.

Sertakan `duitku.js` pada halaman situs anda, sehingga modul `checkout` Duitku dapat digunakan.

_Merchant_ dapat memulai proses pembayaran dengan memanggil fungsi `checkout.process` menggunakan `DUITKU_REFERENCE` yang didapat dari [integrasi _backend_](#integrasi-backend-atau-server) sebagai parameter.

### Lokasi Modul Duitku JS

Anda dapat menambahkan _tag_ berikut pada bagian _head_ HTML anda.

- _Production_:

`<script src="https://app-prod.duitku.com/lib/js/duitku.js"></script>`

- _Sandbox_:

`<script src="https://app-sandbox.duitku.com/lib/js/duitku.js"></script>`

## Duitku JS

Setelah anda menambahkan _library_ Duitku pada HTML anda. Anda dapat menggunakan method `checkout.process` seperti berikut.

### process(duitkuReference, options)

```
checkout.process("DXXXXS875LXXXX32IJZ7", {
    defaultLanguage: "id", //opsional pengaturan bahasa
    currency: "USD", //optional to set rate estimation
    successEvent: function(result){
    // tambahkan fungsi sesuai kebutuhan anda
        console.log('success');
        console.log(result);
        alert('Payment Success');
    },
    pendingEvent: function(result){
    // tambahkan fungsi sesuai kebutuhan anda
        console.log('pending');
        console.log(result);
        alert('Payment Pending');
    },
    errorEvent: function(result){
    // tambahkan fungsi sesuai kebutuhan anda
        console.log('error');
        console.log(result);
        alert('Payment Error');
    },
    closeEvent: function(result){
    // tambahkan fungsi sesuai kebutuhan anda
        console.log('customer closed the popup without finishing the payment');
        console.log(result);
        alert('customer closed the popup without finishing the payment');
    }
});

```

Mulai halaman pembayaran Duitku.

Parameter:

- Nama: duitkuReference
  - Tipe: string
  - Deskripsi: Nomor referensi Duitku didapat pada integrasi backend.
- Nama: options.defaultLanguage
  - Tipe: string (opsional)
  - Deskripsi: Pengaturan bahasa dengan code. en - inggris. id - indonesia.
- Nama: options.currency
  - Tipe: string (opsional)
  - Deskripsi: Pengaturan untuk estimasi perhitungan mata uang asing. USD - Dolar amerika. EUR - Euro.
- Nama: options.successEvent
  - Tipe: function (opsional)
  - Deskripsi: Callback pembayaran sukses (00).
- Nama: options.pendingEvent
  - Tipe: function (opsional)
  - Deskripsi: Callback pembayaran pending (01).
- Nama: options.errorEvent
  - Tipe: function (opsional)
  - Deskripsi: Callback pembayaran error.
- Nama: options.closeEvent
  - Tipe: function (opsional)
  - Deskripsi: Digunakan ketika pelanggan menutup popup pembayaran tanpa menyelesaikan pembayaran (02).

## JS Callback

### Respon Transaksi

```
{
    "resultCode": "00",
    "merchantOrderId": "abcde12345",
    "reference": "qwerty12345"
}

```

Obyek yang mewakili respon transaksi dari _callback_ Duitku.

| Name            | Tipe   | Deskripsi                |
| --------------- | ------ | ------------------------ |
| resultCode      | string | Result code dari Duitku. |
| merchantOrderId | string | Order ID dari merchant.  |
| reference       | string | Reference dari Duitku.   |

## _Window Redirection_

Duitku menyediakan alternatif lain untuk menampilkan halaman transaksi selain menggunakan `duitku.js`, yaitu _window redirection_. _Merchant_ dapat menggunakan _response value_ `paymentUrl` dari API `CreateInvoice`. _Merchant_ tidak perlu menyertakan duitku.js pada halaman situs, sehingga pelanggan langsung diarahkan pada halaman pembayaran di situs Duitku. Untuk konfigurasi bahasa anda dapat menambahkan `&lang=id` _query_ pada `paymentUrl` sebagai berikut.

`https://app-sandbox.duitku.com/redirect_checkout?reference=DXXXXS875LXXXX32IJZ7&lang=id`

- id - Bahasa Indonesia
- en - Bahasa Inggris

Selain dari pengaturan bahasa duitku memiliki pengaturan dalam konversi mata uang. Anda dapat menambahkan `&currency=USD` _query_. Duitku mendukung 2 konversi yaitu :

- USD - (dolar amerika)
- EUR - (Euro)  
  \*Konversi berikut hanya bersifat estimasi. Rate dapat berubah sewaktu waktu.

Dengan menggunakan metode ini, _merchant_ dapat langsung menampilkan halaman pembayaran secara penuh seperti berikut ini:

Sorry, your browser doesn't support embedded videos.

## _Redirect_

Setelah request transaksi dan tagihan terbentuk, dari halaman pembayaran Duitku([_Window Redirection_](#window-redirection)) akan redirect ke alamat yang diberikan di parameter [_Create Invoice_](#create-invoice)(`returnUrl`) pada saat setelah pembayaran atau melalui tombol **kembali**. Dan pada saat redirect tersebut Duitku akan menyertakan beberapa parameter tagihan yang bersangkutan. Anda harus membuat halaman _landing_ di alamat _return_ URL ini.

### Contoh

`GET: http://www.merchantweb.com/redirect.php?merchantOrderId=abcde12345&resultCode=00&reference=DXXXXS875LXXXX32IJZ7`

### Parameter

| Parameter       | Deskripsi                    | Contoh               |
| --------------- | ---------------------------- | -------------------- |
| merchantOrderId | Order ID dari merchant.      | abcde12345           |
| reference       | Nomor referensi dari Duitku. | DXXXXS875LXXXX32IJZ7 |
| resultCode      | Kode informasi hasil proses. | 00                   |

## Payment Method

Berikut ini _payment method_ yang tersedia di Duitku dan dapat anda gunakan. Anda dapat memasukan _payment method_(`paymentMethod`) pada parameter [_create invoice_](#create-invoice), sebagai langkah pembayaran langsung ke satu pembayaran tertentu. Pelanggan akan langsung di arahkan pada pembayaran yang dituju tanpa memilih.

| Jenis Pembayaran | Kode Pembayaran | Keterangan                    |
| ---------------- | --------------- | ----------------------------- |
| Credit Card      | VC              | (Visa / Master Card / JCB)    |
| Virtual Account  | BC              | BCA Virtual Account           |
|                  | M2              | Mandiri Virtual Account       |
|                  | VA              | Maybank Virtual Account       |
|                  | I1              | BNI Virtual Account           |
|                  | B1              | CIMB Niaga Virtual Account    |
|                  | BT              | Permata Bank Virtual Account  |
|                  | A1              | ATM Bersama                   |
|                  | AG              | Bank Artha Graha              |
|                  | NC              | Bank Neo Commerce/BNC         |
|                  | BR              | BRIVA                         |
|                  | S1              | Bank Sahabat Sampoerna        |
|                  | DM              | Danamon Virtual Account       |
|                  | BV              | BSI Virtual Account           |
| Ritel            | FT              | Pegadaian/ALFA/Pos            |
|                  | IR              | Indomaret                     |
| E-Wallet         | OV              | OVO (Support Void)            |
|                  | SA              | ShopeePay Apps (Support Void) |
|                  | LF              | LinkAja Apps (Fixed Fee)      |
|                  | LA              | LinkAja Apps (Percentage Fee) |
|                  | DA              | DANA                          |
|                  | SL              | ShopeePay Account Link        |
|                  | OL              | OVO Account Link              |
| QRIS             | SP              | ShopeePay                     |
|                  | NQ              | Nobu                          |
|                  | GQ              | Gudang Voucher                |
|                  | SQ              | Nusapay                       |
| Credit           | DN              | Indodana Paylater             |
|                  | AT              | ATOME                         |
| E-Banking        | JP              | Jenius Pay                    |
| E-Commerce       | T1              | Tokopedia Card Payment        |
|                  | T2              | Tokopedia E-Wallet            |
|                  | T3              | Tokopedia Others              |

## Daftar _Issuer_ (QRIS)

| Kode     | Issuer                                         |
| -------- | ---------------------------------------------- |
| 93600999 | AHDI                                           |
| 93600947 | Aladin Syariah                                 |
| 93600567 | Allo Bank Indonesia                            |
| 93600531 | Amar                                           |
| 93600822 | Astrapay                                       |
| 93600116 | Bank Aceh Syariah                              |
| 93600037 | Bank Artha Graha Internasional                 |
| 93600133 | Bank BPD Bengkulu                              |
| 93600124 | Bank BPD Kalimantan Timur dan Kalimantan Utara |
| 93600161 | Bank Ganesha                                   |
| 93600513 | Bank Ina Perdana                               |
| 93600113 | Bank Jateng                                    |
| 93600123 | Bank Kalbar                                    |
| 93600122 | Bank Kalsel                                    |
| 93600441 | Bank KB Bukopin                                |
| 93600121 | Bank Lampung                                   |
| 93600157 | Bank Maspion                                   |
| 93600553 | Bank Mayora                                    |
| 93600548 | Bank Multiarta Sentosa                         |
| 93600490 | Bank Neo Commerce                              |
| 93600128 | Bank NTB Syariah                               |
| 93600019 | Bank Panin                                     |
| 93600132 | Bank Papua                                     |
| 93600115 | Bank Pembangunan Daerah Jambi                  |
| 93600494 | Bank Raya                                      |
| 93600119 | Bank Riau Kepri                                |
| 93600523 | Bank Sahabat Sampoerna                         |
| 93600152 | Bank Shinhan                                   |
| 93600126 | Bank Sulsel                                    |
| 93600120 | Bank Sumselbabel                               |
| 93600023 | Bank UOB Indonesia                             |
| 93600808 | Bayarind                                       |
| 93600014 | BCA                                            |
| 93600536 | BCA Syariah                                    |
| 93600501 | BCAD                                           |
| 93600815 | Bimasakti Multi Sinergi                        |
| 93600110 | BJB                                            |
| 93600425 | BJB Syariah                                    |
| 93600919 | BluePay                                        |
| 93600009 | BNI                                            |
| 93600129 | BPD Bali                                       |
| 93600112 | BPD DIY                                        |
| 93600130 | BPD NTT                                        |
| 93600114 | BPD-JATIM                                      |
| 93600002 | BRI                                            |
| 93600422 | BRIS Pay                                       |
| 93600200 | BTN                                            |
| 93600076 | Bumi Arta                                      |
| 93600031 | Citibank                                       |
| 93600950 | Commonwealth                                   |
| 93600915 | Dana                                           |
| 93600011 | Danamon                                        |
| 93600046 | DBS MAX QRIS                                   |
| 93600111 | DKI                                            |
| 93600899 | Doku                                           |
| 93600998 | DSP                                            |
| 93600827 | Fello                                          |
| 93600777 | Finpay                                         |
| 93600813 | GAJA                                           |
| 93600914 | Go-Pay                                         |
| 93600916 | Gudang Voucher                                 |
| 93600484 | Hana bank                                      |
| 93600789 | IMkas                                          |
| 93600920 | Isaku                                          |
| 93600542 | JAGO                                           |
| 93600213 | Jenius                                         |
| 93600812 | Kaspro                                         |
| 93600911 | LinkAja                                        |
| 93600008 | Mandiri Pay                                    |
| 93600016 | Maybank                                        |
| 93600426 | Mega                                           |
| 93600821 | Midazpay                                       |
| 93600485 | Motion Banking                                 |
| 93600147 | Muamalat                                       |
| 93600118 | Nagari                                         |
| 93600814 | Netzme                                         |
| 93600022 | Niaga                                          |
| 93600503 | Nobu                                           |
| 93600028 | OCBC                                           |
| 93600811 | OTTOCASH                                       |
| 93600912 | OVO                                            |
| 93600820 | PAC Cash                                       |
| 93600818 | Paydia                                         |
| 93600917 | Paytrend                                       |
| 93600013 | Permata                                        |
| 93608161 | POS Indonesia                                  |
| 93600167 | QNB Indonesia                                  |
| 93600921 | Saldomu                                        |
| 93600535 | Seabank                                        |
| 93600918 | ShopeePay                                      |
| 93600153 | Sinarmas                                       |
| 93600816 | SPIN                                           |
| 93600451 | Syariah Indonesia                              |
| 93600898 | T-Money                                        |
| 93600828 | TrueMoney                                      |
| 93600835 | Virgo                                          |
| 93600830 | YODU                                           |
| 93600817 | Yukk                                           |
| 93600825 | Zipay                                          |

## Errors

## Respon HTTP

- Kode Error: 400
  - Nama Error: Bad Request
  - Keterangan: Ada kesalahan pada saat mengirimkan permohonan pada API.
- Kode Error: 400
  - Nama Error: Amount is different please try again later.
  - Keterangan: Error berikut ini terjadi karena anda mencoba untuk mengirim request ulang atau membuat ulang invoice di satu waktu yang sama dan dengan order ID yang sama namun nominal yang berbeda.
- Kode Error:
  - Nama Error: SaveCardToken is not available.
  - Keterangan: Error berikut ini terjadi karena akun anda belum mendukung fitur tokenisasi.
- Kode Error: 401
  - Nama Error: Unauthorized
  - Keterangan: Akses di tolak batasan kewenangan.
- Kode Error: 404
  - Nama Error: Not Found
  - Keterangan: Halaman atau API yang di request tidak di temukan.
- Kode Error: 409
  - Nama Error: The transaction is still in progress.
  - Keterangan: Error berikut ini terjadi karena anda mencoba untuk mengirim request ulang atau membuat ulang invoice di satu waktu yang sama dan dengan order ID yang sama. (Disaat request pertama masih dalam proses).
- Kode Error: 500
  - Nama Error: Internal Server Error
  - Keterangan: Error pada saat melakukan proses permohonan.

## Respon API

### Callback

| Kode | Nama    | Keterangan                          |
| ---- | ------- | ----------------------------------- |
| 00   | Success | Transaksi telah sukses terbayarkan. |
| 02   | Failed  | Transaksi gagal terbayarkan.        |

### Redirect

| Kode | Nama            | Keterangan                                |
| ---- | --------------- | ----------------------------------------- |
| 00   | Success         | Transaksi telah terbayar.                 |
| 01   | Process         | Transaksi belum terbayar.                 |
| 02   | Canceled/Failed | Transaksi dibatalkan atau tidak terbayar. |

## Uji Coba

Berikut adalah daftar kredensial transaksi _dummy_ yang dapat digunakan untuk melakukan transaksi di _sandbox_.

## Kartu Kredit

### 3D _Secure Transaction_

| Tipe Kartu | Nomor Kartu Kredit  | Masa Berlaku | CVV |
| ---------- | ------------------- | ------------ | --- |
| VISA       | 4000 0000 0000 0044 | 03/33        | 123 |
| MASTERCARD | 5500 0000 0000 0004 | 03/33        | 123 |

## Virtual Akun

Demo _transaction virtual account sandbox_ [klik-disini](https://sandbox.duitku.com/payment/demo/demosuccesstransaction.aspx).

## E-Money

### Shopee

Untuk pengetesan transaksi shopee dapat mengunduh shopeeapp _staging apk_ [disini](https://drive.google.com/drive/folders/1yYfpPZ__-fdvQpUr7Zjs4-GGC0Z_XYs7?usp=drive_link).

## QRIS

### Shopeepay

Untuk pengetesan transaksi Shopee QRIS gunakan [Shopeeapp](https://drive.google.com/drive/folders/1yYfpPZ__-fdvQpUr7Zjs4-GGC0Z_XYs7?usp=drive_link) seperti shopee e-money.

### Gudang Voucher

Untuk pengetesan transaksi Gudang Voucher dapat menggunakan [demo sukses virtual account](https://sandbox.duitku.com/payment/demo/demosuccesstransaction.aspx).

### Nusapay

| Nomor Telepon | PIN    | OTP    |
| ------------- | ------ | ------ |
| 08188886666   | 123789 | 123456 |

Untuk pengetesan transaksi Nusapay QRIS dapat mengunduh Nusapay _staging apk_ [disini](https://drive.google.com/drive/folders/1bMAoU75z9RUJkw6Z93MaeuE2Vee5grP5).

## Paylater

### Indodana

| Nomor Telepon | PIN    | OTP    |
| ------------- | ------ | ------ |
| 081282325566  | 000000 |        |
| 0838499610    | 123654 | 999999 |
| 085780110019  | 123654 | 999999 |

### Atome

**Transaksi Berhasil**

| Country Code | Nomor Telepon | OTP  |
| ------------ | ------------- | ---- |
| ID           | +62811000122  | 7524 |

**Transaksi Gagal**

| Country Code | Nomor Telepon   | OTP  |
| ------------ | --------------- | ---- |
| ID           | +62810000001500 | 1111 |

## E-Banking

### Jenius Pay

| E-mail            | Password    | CashTag      | OTP                |
| ----------------- | ----------- | ------------ | ------------------ |
| [email protected] | P@ssw0rd123 | $testjenpay4 | 6 digit angka acak |

Untuk pengetesan transaksi Jenius Pay, hanya ada dalam _website_ Jenius yang dapat diakses [di sini](https://uat-jeniuspay-partners.surge.sh/#/authentication/login)

## E-Commerce

### Tokopedia

Untuk uji coba tokopedia bisa menggunakan [_virtual account demo success_](https://sandbox.duitku.com/payment/demo/demosuccesstransaction.aspx).

## Pop API Demo

Pop API Demo [klik-disini](https://api-sandbox.duitku.com/demoduitku/).

## Contoh Proyek

Untuk contoh proyek, anda dapat mengakses tautan Github [disini](https://github.com/duitkupg/sample-project-duitku-pop).

## Changelog

Jun 2026

- Penambahan parameter `customerName` informasi akun issuer pada callback

Feb 2026

- Penambahan Payment channel Tokopedia Card Payment.
- Penambahan Payment channel Tokopedia E-Wallet.
- Penambahan Payment channel Tokopedia Others.
- Penambahan testing untuk E-Commerce.

Dec 2025

- Penambahan **requirement** untuk callback.

_Oct 2025_

- Penambahan parameter `customerDetail.merchantCustomerId` dan `creditCardDetail.saveCardToken` pada _Create Invoice_
- Penambahan _object_ `customerDetail.merchantCustomerId` dan `creditCardDetail.saveCardToken` pada JSON _Object_
- Penambahan catatan untuk fitur _tokenise_
- Penambahan parameter `merchantCustomerId` dan `tokenId` pada _Callback_

_Aug 2025_

- Pengurangan payment channel QRIS Dana
- Fix Jenius staging demo payment URL

_Okt 2022_

- Parameter CreditCardDetail ditambahkan pada inquiry request
- CreditCardDetail ditambahkan pada JSON Object
- Penambahan tabel detail informasi expiryPeriod

_Jan 2020_

- Parameter CustomerDetail ditambahkan pada inquiry request
- CustomerDetail ditambahkan pada JSON Object
- Address ditambahkan pada JSON Object

_Jan 2019_

- Parameter customerVaName dan expiryPerion ditambahkan pada inquiry request
- Respon parameter vaNumber, amount, statusCode dan statusMessage ditambahkan pada inquiryResponse
