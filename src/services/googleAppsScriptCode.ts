export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT - WARKOP TWG POS & MANAJEMEN KEUANGAN ALL-IN-ONE
 * =========================================================================
 * 
 * FITUR TERCAKUP:
 * 1. Manajemen User (Owner & Kasir)
 * 2. Master Produk & Stok Bahan (Kopi, Makanan, Snack, Konsinyasi)
 * 3. Transaksi Kasir POS Real-Time & Detail Item Transaksi
 * 4. Pemasukan Kas Warung & Rekap Saldo
 * 5. Pengeluaran Kulakan & Stok Bahan Baku
 * 6. Biaya Operasional (Opex) Rutin & Harian
 * 7. Mitra Konsinyasi & Log Bagi Hasil (Settlement)
 * 8. Log Presensi / Absensi Worker + Upload Foto Selfie ke Google Drive
 * 9. Rekap Tutup Shift Kasir & Uang Fisik Laci
 * 10. Saldo Kas Warung & Mutasi Kas
 * 
 * -------------------------------------------------------------------------
 * PANDUAN CARA DEPLOY (HANYA 1 KALI):
 * -------------------------------------------------------------------------
 * 1. Buka Google Spreadsheet baru (atau yang sudah ada) di Google Drive Anda.
 * 2. Beri nama Spreadsheet: "DATABASE WARKOP TWG"
 * 3. Klik menu: Ekstensi > Apps Script.
 * 4. Hapus seluruh isi default pada Code.gs, lalu PASTE SEMUA KODE INI.
 * 5. (Opsional tapi disarankan) Pilih fungsi "setupDatabase" di dropdown atas lalu klik "Run" / "Jalankan" sekali untuk otomatis membuat semua 12 sheet lengkap dengan format warna & contoh data.
 * 6. Klik tombol "Deploy" (di pojok kanan atas) > "New deployment" (Deployment baru).
 * 7. Pilih tipe icon Gear: "Web app" (Aplikasi Web).
 * 8. Isi deskripsi: "Warkop TWG POS Backend All Fitur"
 * 9. Execute as: "Me" (Email Google Anda)
 * 10. Who has access: "Anyone" (Siapa saja, termasuk anonim) -> PENTING!
 * 11. Klik "Deploy", lalu klik "Authorize access" dan pilih akun Google Anda.
 * 12. Salin "Web App URL" (akhiran /exec) dan paste ke menu Pengaturan di Aplikasi POS Warkop TWG!
 * =========================================================================
 */

// Konfigurasi Folder Google Drive untuk Foto Selfie Presensi Kasir
const GOOGLE_DRIVE_ATTENDANCE_FOLDER_ID = "1B-UgnmWX1zkPjNhy19jVSmrSbnZjr_D5";

/**
 * Inisialisasi & Setup Seluruh Sheet Database Warkop TWG
 * Jalankan fungsi ini dari Apps Script atau akan otomatis dibuat saat request pertama.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Definisi 12 Sheet & Kolom Header
  const sheetDefinitions = {
    "Users": {
      headers: ["id", "username", "password_hash", "role", "nama", "pin", "status", "created_at"],
      color: "#8B4513",
      sampleData: [
        ["u-owner-1", "prima", "admin123", "owner", "PRIMA", "1234", "AKTIF", new Date().toISOString()],
        ["u-kasir-1", "bima", "kasir123", "kasir", "BIMA", "0000", "AKTIF", new Date().toISOString()]
      ]
    },
    "Produk": {
      headers: ["id", "nama_produk", "kategori", "harga_beli", "harga_jual", "laba_unit", "stok", "satuan", "is_konsinyasi", "id_mitra", "nama_mitra", "skema_mitra_tipe", "skema_mitra_nilai", "barcode", "status"],
      color: "#D9603E",
      sampleData: [
        ["p-1", "Kopi Hitam Tubruk TWG", "Kopi", 3000, 6000, 3000, 100, "Cangkir", "FALSE", "", "", "", 0, "8991001", "AKTIF"],
        ["p-2", "Kopi Susu Aren Spesial", "Kopi", 5000, 10000, 5000, 80, "Gelas", "FALSE", "", "", "", 0, "8991002", "AKTIF"],
        ["p-3", "Es Teh Manis Jumbo", "Non-Kopi", 2000, 5000, 3000, 150, "Gelas", "FALSE", "", "", "", 0, "8991003", "AKTIF"],
        ["p-4", "Indomie Goreng + Telur + Kornet", "Makanan", 7000, 14000, 7000, 50, "Porsi", "FALSE", "", "", "", 0, "8991004", "AKTIF"],
        ["p-5", "Roti Bakar Cokelat Keju", "Makanan", 6000, 12000, 6000, 40, "Porsi", "FALSE", "", "", "", 0, "8991005", "AKTIF"],
        ["p-6", "Aneka Gorengan Renyah (Mitra Ibu Ani)", "Titipan Mitra", 1000, 2000, 500, 60, "Pcs", "TRUE", "m-1", "Ibu Ani (Gorengan)", "persen", 75, "8991006", "AKTIF"]
      ]
    },
    "Transaksi_POS": {
      headers: ["id", "no_invoice", "tanggal", "jam", "kasir_id", "kasir_nama", "pelanggan", "subtotal", "diskon", "total", "metode_bayar", "bayar", "kembali", "total_items", "status", "items_json", "catatan"],
      color: "#2E7D32"
    },
    "Detail_Item_Transaksi": {
      headers: ["id", "no_invoice", "tanggal", "jam", "id_produk", "nama_produk", "kategori", "qty", "harga_satuan", "subtotal", "laba_kotor", "is_konsinyasi", "id_mitra"],
      color: "#1B5E20"
    },
    "Pemasukan_Harian": {
      headers: ["id", "tanggal", "jam", "sumber", "jumlah", "keterangan", "input_by", "no_referensi"],
      color: "#0288D1",
      sampleData: [
        ["inc-init", Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"), "08:00:00", "Modal Kas Awal Warung", 500000, "Saldo kas awal laci kasir", "PRIMA", "INIT-001"]
      ]
    },
    "Pengeluaran_Kulakan": {
      headers: ["id", "tanggal", "nama_bahan", "kategori", "jumlah", "satuan", "harga_satuan", "total", "supplier", "catatan", "input_by"],
      color: "#C2185B"
    },
    "Opex": {
      headers: ["id", "tanggal", "kategori", "nama", "jumlah", "keterangan", "is_recurring", "input_by"],
      color: "#7B1FA2"
    },
    "Mitra_Konsinyasi": {
      headers: ["id", "nama_mitra", "kontak", "alamat", "produk_dititipkan_json", "skema_bagi_hasil", "skema_tipe", "skema_nilai", "rekening_bank", "status", "catatan"],
      color: "#E65100",
      sampleData: [
        ["m-1", "Ibu Ani (Gorengan)", "081234567890", "Jl. Warung TWG No. 12", '["Aneka Gorengan Renyah", "Keripik Singkong"]', "75% Mitra / 25% Warkop", "persen", 75, "BCA 882019281 a.n Ani", "AKTIF", "Vendor titip gorengan tiap pagi"]
      ]
    },
    "Log_Konsinyasi": {
      headers: ["id", "tanggal", "id_mitra", "nama_mitra", "id_produk", "nama_produk", "no_invoice", "qty_terjual", "total_penjualan", "bagian_mitra", "bagian_warkop", "status_settle", "settled_at", "catatan"],
      color: "#BF360C"
    },
    "Log_Absensi": {
      headers: ["id", "tanggal", "jam", "worker_id", "worker_nama", "tipe", "file_name", "drive_file_id", "drive_file_url", "status", "catatan"],
      color: "#4A148C"
    },
    "Shift_Kasir": {
      headers: ["id", "kasir_id", "kasir_nama", "waktu_buka", "waktu_tutup", "modal_awal", "total_tunai_sistem", "total_qris_sistem", "total_transfer_sistem", "total_penjualan_sistem", "uang_fisik_laci", "selisih", "status", "catatan"],
      color: "#004D40"
    },
    "Kas_Warung_Saldo": {
      headers: ["id", "tanggal", "jam", "tipe_mutasi", "nominal", "saldo_akhir", "keterangan", "input_by"],
      color: "#37474F"
    }
  };
  
  for (const sheetName in sheetDefinitions) {
    let sheet = ss.getSheetByName(sheetName);
    const def = sheetDefinitions[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(def.headers);
      
      // Styling Header Row
      const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setBackground(def.color || "#D9603E");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 32);
      sheet.setFrozenRows(1);
      
      // Masukkan sample data jika ada
      if (def.sampleData && def.sampleData.length > 0) {
        def.sampleData.forEach(row => sheet.appendRow(row));
      }
      
      // Auto-fit kolom
      for (let col = 1; col <= def.headers.length; col++) {
        sheet.autoResizeColumn(col);
      }
    }
  }
  
  // Hapus Sheet1 default jika kosong
  const sheet1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Sheet 1");
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch(e) {}
  }
  
  Logger.log("✅ Database Warkop TWG Berhasil Diinisialisasi Lengkap!");
  return { success: true, message: "Semua 12 sheet database Warkop TWG siap digunakan!" };
}

/**
 * Router Utama POST Request (Menerima JSON dari Aplikasi Web)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  
  try {
    setupDatabase(); // Pastikan seluruh sheet tersedia
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      contents = e.parameter;
    }
    
    const action = contents.action || (e && e.parameter && e.parameter.action);
    const data = contents.data || contents;
    
    let result = { success: false, message: "Action tidak dikenali" };
    
    switch (action) {
      case "ping":
        result = { 
          success: true, 
          message: "Koneksi Google Spreadsheet Warkop TWG Berhasil & Aktif!", 
          spreadsheet_name: ss.getName(),
          timestamp: new Date().toISOString() 
        };
        break;
        
      case "setupDatabase":
        result = setupDatabase();
        break;
        
      case "getInitialData":
        result = handleGetInitialData(ss);
        break;
        
      case "createTransaction":
        result = handleCreateTransaction(ss, data);
        break;
        
      case "saveProduct":
        result = handleSaveProduct(ss, data);
        break;
        
      case "deleteProduct":
        result = handleDeleteProduct(ss, data.id);
        break;
        
      case "saveMitra":
        result = handleSaveMitra(ss, data);
        break;
        
      case "settleConsignment":
        result = handleSettleConsignment(ss, data);
        break;
        
      case "addPemasukan":
        result = handleAddPemasukan(ss, data);
        break;
        
      case "addPengeluaran":
        result = handleAddPengeluaran(ss, data);
        break;
        
      case "addOpex":
        result = handleAddRow(ss, "Opex", data);
        break;
        
      case "closeShift":
        result = handleCloseShift(ss, data);
        break;
        
      case "uploadAttendancePhoto":
        result = handleUploadAttendancePhoto(ss, data);
        break;
        
      case "syncAll":
        result = handleSyncAll(ss, data);
        break;
        
      default:
        result = { success: false, message: "Action '" + action + "' belum diimplementasikan." };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString(),
      message: "Terjadi error pada Apps Script: " + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Router GET Request (Health Check & JSON Viewer)
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().map(s => s.getName());
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    app: "WARKOP TWG POS Backend API",
    spreadsheet: ss.getName(),
    sheets: sheets,
    total_sheets: sheets.length,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------------------
// HANDLERS BISNIS LOGIC WARKOP TWG
// -------------------------------------------------------------------------

function getSheetRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, idx) => {
      let val = row[idx];
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[header] = val;
    });
    return obj;
  });
}

function handleGetInitialData(ss) {
  const sheetNames = [
    "Users", "Produk", "Transaksi_POS", "Pemasukan_Harian", 
    "Pengeluaran_Kulakan", "Opex", "Mitra_Konsinyasi", 
    "Log_Konsinyasi", "Log_Absensi", "Shift_Kasir"
  ];
  let data = {};
  
  sheetNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    data[name] = sheet ? getSheetRows(sheet) : [];
  });
  
  return { success: true, data: data };
}

function handleCreateTransaction(ss, trx) {
  const sheetTrx = ss.getSheetByName("Transaksi_POS");
  const sheetDetail = ss.getSheetByName("Detail_Item_Transaksi");
  const sheetProd = ss.getSheetByName("Produk");
  const sheetLog = ss.getSheetByName("Log_Konsinyasi");
  const sheetPemasukan = ss.getSheetByName("Pemasukan_Harian");
  
  const items = trx.items || [];
  const itemsJson = JSON.stringify(items);
  const now = new Date();
  const timeStr = trx.jam || Utilities.formatDate(now, "GMT+7", "HH:mm:ss");
  const dateStr = trx.tanggal || Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd");
  
  // 1. Catat ke Transaksi_POS
  sheetTrx.appendRow([
    trx.id,
    trx.no_invoice,
    dateStr,
    timeStr,
    trx.kasir_id || "u-kasir",
    trx.kasir || trx.kasir_nama || "Kasir",
    trx.pelanggan || "Umum",
    trx.subtotal || 0,
    trx.diskon || 0,
    trx.total || 0,
    trx.metode_bayar || "TUNAI",
    trx.bayar || 0,
    trx.kembali || 0,
    items.length,
    trx.status || "SUKSES",
    itemsJson,
    trx.catatan || ""
  ]);
  
  // 2. Catat ke Detail_Item_Transaksi & Update Stok Produk
  const prodRows = sheetProd.getDataRange().getValues();
  
  items.forEach(item => {
    const qty = Number(item.qty) || 1;
    const hargaSatuan = Number(item.harga) || 0;
    const subtotal = Number(item.subtotal) || (qty * hargaSatuan);
    const hargaBeli = Number(item.harga_beli) || 0;
    const labaKotor = subtotal - (hargaBeli * qty);
    
    // Detail item
    if (sheetDetail) {
      sheetDetail.appendRow([
        "det-" + Utilities.getUuid().slice(0, 8),
        trx.no_invoice,
        dateStr,
        timeStr,
        item.produk_id,
        item.nama,
        item.kategori || "-",
        qty,
        hargaSatuan,
        subtotal,
        labaKotor,
        item.is_konsinyasi ? "TRUE" : "FALSE",
        item.id_mitra || ""
      ]);
    }
    
    // Kurangi stok di sheet Produk
    for (let i = 1; i < prodRows.length; i++) {
      if (prodRows[i][0] == item.produk_id) {
        const currentStock = Number(prodRows[i][6]) || Number(prodRows[i][5]) || 0;
        const newStock = Math.max(0, currentStock - qty);
        sheetProd.getRange(i + 1, 7).setValue(newStock); // kolom stok
        break;
      }
    }
    
    // Catat ke Log_Konsinyasi jika item titip jual mitra
    if (item.is_konsinyasi && item.id_mitra && sheetLog) {
      let bagMitra = 0;
      if (item.skema_mitra_tipe === "nominal" && item.skema_mitra_nilai) {
        bagMitra = Number(item.skema_mitra_nilai) * qty;
      } else if (item.skema_mitra_nilai) {
        bagMitra = (subtotal * Number(item.skema_mitra_nilai)) / 100;
      } else {
        bagMitra = subtotal * 0.75; // default 75% mitra
      }
      const bagWarkop = subtotal - bagMitra;
      
      sheetLog.appendRow([
        "log-" + Utilities.getUuid().slice(0, 8),
        dateStr,
        item.id_mitra,
        item.nama_mitra || "Mitra",
        item.produk_id,
        item.nama,
        trx.no_invoice,
        qty,
        subtotal,
        bagMitra,
        bagWarkop,
        "BELUM SETTLE",
        "",
        ""
      ]);
    }
  });
  
  // 3. Catat Kas Masuk Otomatis ke Pemasukan_Harian
  if (sheetPemasukan && trx.total > 0) {
    sheetPemasukan.appendRow([
      "inc-" + Utilities.getUuid().slice(0, 8),
      dateStr,
      timeStr,
      "Penjualan POS (" + (trx.metode_bayar || "TUNAI") + ")",
      trx.total,
      "Invoice: " + trx.no_invoice + " - Kasir: " + (trx.kasir || "BIMA"),
      trx.kasir || "Kasir",
      trx.no_invoice
    ]);
  }
  
  return { success: true, message: "Transaksi " + trx.no_invoice + " berhasil dicatat & stok terupdate" };
}

function handleSaveProduct(ss, prod) {
  const sheet = ss.getSheetByName("Produk");
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == prod.id) {
      foundRow = i + 1;
      break;
    }
  }
  
  const labaUnit = (Number(prod.harga_jual) || 0) - (Number(prod.harga_beli) || 0);
  const rowValues = [
    prod.id,
    prod.nama_produk,
    prod.kategori || "Umum",
    Number(prod.harga_beli) || 0,
    Number(prod.harga_jual) || 0,
    labaUnit,
    Number(prod.stok) || 0,
    prod.satuan || "Pcs",
    prod.is_konsinyasi ? "TRUE" : "FALSE",
    prod.id_mitra || "",
    prod.nama_mitra || "",
    prod.skema_mitra_tipe || "",
    Number(prod.skema_mitra_nilai) || 0,
    prod.barcode || "",
    prod.status || "AKTIF"
  ];
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  return { success: true, message: "Data produk '" + prod.nama_produk + "' berhasil disimpan" };
}

function handleDeleteProduct(ss, id) {
  const sheet = ss.getSheetByName("Produk");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Produk berhasil dihapus" };
    }
  }
  return { success: false, message: "Produk tidak ditemukan" };
}

function handleSaveMitra(ss, mitra) {
  const sheet = ss.getSheetByName("Mitra_Konsinyasi");
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == mitra.id) {
      foundRow = i + 1;
      break;
    }
  }
  
  const rowValues = [
    mitra.id,
    mitra.nama_mitra,
    mitra.kontak || "",
    mitra.alamat || "",
    JSON.stringify(mitra.produk_dititipkan || []),
    mitra.skema_bagi_hasil || "",
    mitra.skema_tipe || "persen",
    Number(mitra.skema_nilai) || 0,
    mitra.rekening_bank || "",
    mitra.status || "AKTIF",
    mitra.catatan || ""
  ];
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  return { success: true, message: "Data mitra '" + mitra.nama_mitra + "' berhasil disimpan" };
}

function handleSettleConsignment(ss, data) {
  const sheet = ss.getSheetByName("Log_Konsinyasi");
  const rows = sheet.getDataRange().getValues();
  const logIds = data.log_ids || [];
  const now = new Date().toISOString();
  let updatedCount = 0;
  
  for (let i = 1; i < rows.length; i++) {
    if (logIds.includes(rows[i][0])) {
      sheet.getRange(i + 1, 12).setValue("SUDAH SETTLE");
      sheet.getRange(i + 1, 13).setValue(now);
      updatedCount++;
    }
  }
  
  return { success: true, message: updatedCount + " data settlement konsinyasi berhasil diselesaikan" };
}

function handleAddPemasukan(ss, data) {
  const sheet = ss.getSheetByName("Pemasukan_Harian");
  const now = new Date();
  sheet.appendRow([
    data.id || ("inc-" + Date.now()),
    data.tanggal || Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd"),
    data.jam || Utilities.formatDate(now, "GMT+7", "HH:mm:ss"),
    data.sumber || "Kas Masuk",
    Number(data.jumlah) || 0,
    data.keterangan || "",
    data.input_by || "Owner",
    data.no_referensi || ""
  ]);
  return { success: true, message: "Pemasukan kas berhasil dicatat" };
}

function handleAddPengeluaran(ss, data) {
  const sheet = ss.getSheetByName("Pengeluaran_Kulakan");
  const now = new Date();
  sheet.appendRow([
    data.id || ("kul-" + Date.now()),
    data.tanggal || Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd"),
    data.nama_bahan || "",
    data.kategori || "Bahan Baku",
    Number(data.jumlah) || 1,
    data.satuan || "Kg",
    Number(data.harga_satuan) || 0,
    Number(data.total) || 0,
    data.supplier || "",
    data.catatan || "",
    data.input_by || "Owner"
  ]);
  return { success: true, message: "Pengeluaran kulakan berhasil dicatat" };
}

function handleCloseShift(ss, shift) {
  const sheet = ss.getSheetByName("Shift_Kasir");
  const now = new Date();
  sheet.appendRow([
    shift.id || ("shift-" + Date.now()),
    shift.kasir_id || "u-kasir-1",
    shift.kasir_nama || "BIMA",
    shift.waktu_buka || "",
    shift.waktu_tutup || Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss"),
    Number(shift.modal_awal) || 0,
    Number(shift.total_tunai_sistem) || 0,
    Number(shift.total_qris_sistem) || 0,
    Number(shift.total_transfer_sistem) || 0,
    Number(shift.total_penjualan_sistem) || 0,
    Number(shift.uang_fisik_laci) || 0,
    Number(shift.selisih) || 0,
    "CLOSED",
    shift.catatan || ""
  ]);
  return { success: true, message: "Tutup shift kasir berhasil direkap" };
}

function handleAddRow(ss, sheetName, rowData) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: "Sheet " + sheetName + " tidak ditemukan" };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : "");
  sheet.appendRow(row);
  return { success: true, message: "Data " + sheetName + " berhasil ditambahkan" };
}

/**
 * Upload Foto Selfie Presensi Worker Langsung ke Folder Google Drive & Catat di Sheet Log_Absensi
 */
function handleUploadAttendancePhoto(ss, data) {
  try {
    const folderId = data.folder_id || GOOGLE_DRIVE_ATTENDANCE_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    
    let base64Data = data.base64 || "";
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }
    
    if (!base64Data) {
      return { success: false, message: "Data foto selfie kosong" };
    }
    
    const decoded = Utilities.base64Decode(base64Data);
    const fileName = data.file_name || ("absen_" + new Date().getTime() + ".jpg");
    const blob = Utilities.newBlob(decoded, "image/jpeg", fileName);
    const file = folder.createFile(blob);
    file.setDescription("Foto Selfie Presensi Warkop TWG - " + (data.worker_nama || "Worker") + " - " + (data.waktu || new Date().toISOString()));
    
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    
    // Log ke sheet Log_Absensi
    let sheetAbsen = ss.getSheetByName("Log_Absensi");
    if (!sheetAbsen) {
      sheetAbsen = ss.insertSheet("Log_Absensi");
      sheetAbsen.appendRow(["id", "tanggal", "jam", "worker_id", "worker_nama", "tipe", "file_name", "drive_file_id", "drive_file_url", "status", "catatan"]);
    }
    
    sheetAbsen.appendRow([
      data.id || ("att-" + new Date().getTime()),
      data.tanggal_display || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
      data.jam_display || Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss"),
      data.worker_id || "u-kasir-1",
      data.worker_nama || "BIMA",
      data.tipe || "MASUK",
      fileName,
      fileId,
      fileUrl,
      "TERVERIFIKASI",
      data.catatan || ""
    ]);
    
    return {
      success: true,
      message: "Foto selfie " + fileName + " berhasil diunggah ke Google Drive & dicatat!",
      drive_file_id: fileId,
      drive_file_url: fileUrl
    };
  } catch (err) {
    return {
      success: false,
      message: "Gagal upload ke Google Drive: " + err.message
    };
  }
}

function handleSyncAll(ss, allData) {
  return { success: true, message: "Sinkronisasi full backup data selesai" };
}
`;
