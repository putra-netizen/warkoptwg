export type UserRole = 'kasir' | 'admin';

export interface User {
  id: string;
  username: string;
  password_hash?: string;
  role: UserRole;
  nama: string;
  status: 'aktif' | 'nonaktif';
}

export type ProductCategory = 
  | 'Kopi & Teh'
  | 'Minuman Dingin'
  | 'Indomie & Mie'
  | 'Makanan & Toast'
  | 'Snack & Gorengan'
  | 'Konsinyasi'
  | 'Lainnya';

export interface Product {
  id: string;
  nama_produk: string;
  kategori: ProductCategory | string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  satuan: string; // 'Porsi', 'Cangkir', 'Gelas', 'Bungkus', 'Pcs'
  is_konsinyasi: boolean;
  id_mitra?: string;
  skema_mitra_tipe?: 'persen' | 'nominal'; // e.g. 70% mitra / Rp 1.500 per item
  skema_mitra_nilai?: number;
  gambar?: string;
  kode?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  catatan?: string;
  subtotal: number;
}

export type PaymentMethod = 'TUNAI' | 'QRIS' | 'KASBON_BELUM_BAYAR';

export interface TransactionItemRecord {
  produk_id: string;
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
  is_konsinyasi?: boolean;
  id_mitra?: string;
}

export interface TransactionPOS {
  id: string;
  no_invoice: string;
  tanggal: string; // ISO string or YYYY-MM-DD HH:mm:ss
  kasir: string;
  items: TransactionItemRecord[];
  subtotal: number;
  diskon: number;
  total: number;
  metode_bayar: PaymentMethod;
  bayar: number;
  kembali: number;
  status: 'LUNAS' | 'BELUM BAYAR' | 'BATAL';
  catatan?: string;
}

export interface PemasukanHarian {
  id: string;
  tanggal: string;
  sumber: 'POS Warkop' | 'Manual' | 'Catering' | 'Lainnya';
  jumlah: number;
  keterangan: string;
  input_by: string;
}

export interface PengeluaranKulakan {
  id: string;
  tanggal: string;
  nama_bahan: string;
  jumlah: number;
  satuan: string;
  harga_satuan: number;
  total: number;
  supplier: string;
  catatan?: string;
}

export type OpexCategory = 'Gaji' | 'Sewa' | 'Listrik' | 'Wifi' | 'Gas & Air' | 'Maintenance' | 'Lainnya';

export interface Opex {
  id: string;
  tanggal: string;
  kategori: OpexCategory;
  nama: string;
  jumlah: number;
  keterangan: string;
  is_recurring?: boolean;
}

export interface MitraKonsinyasi {
  id: string;
  nama_mitra: string;
  kontak: string;
  produk_dititipkan: string[]; // Product IDs
  skema_bagi_hasil: string; // e.g. "80% Mitra, 20% Warkop" or "Rp 2.000 / pcs"
  skema_tipe: 'persen' | 'nominal';
  skema_nilai: number; // e.g. 80 (meaning 80% to partner) or 2000 (Rp 2.000 to partner per item)
  status: 'aktif' | 'nonaktif';
  rekening_bank?: string;
}

export interface LogKonsinyasi {
  id: string;
  tanggal: string;
  id_mitra: string;
  nama_mitra: string;
  id_produk: string;
  nama_produk: string;
  no_invoice: string;
  qty_terjual: number;
  total_penjualan: number;
  bagian_mitra: number;
  bagian_warkop: number;
  status_settle: 'BELUM SETTLE' | 'SUDAH SETTLE';
  settled_at?: string;
}

export interface ShiftRekap {
  kasir_nama: string;
  waktu_buka: string;
  waktu_tutup: string;
  total_transaksi: number;
  total_omzet: number;
  total_tunai: number;
  total_qris: number;
  total_kasbon: number;
  modal_awal: number;
  total_uang_laci: number;
  selisih: number;
}

export interface SaldoLog {
  id: string;
  tanggal: string; // ISO date string
  tipe: 'MASUK' | 'KELUAR' | 'SET_SALDO';
  jumlah: number;
  keterangan: string;
  saldo_akhir: number;
  input_by: string;
}

export interface AttendanceLog {
  id: string;
  worker_nama: string; // e.g. 'BIMA'
  worker_id?: string;
  tipe: 'MASUK' | 'KELUAR';
  waktu: string; // ISO date string
  tanggal_display: string; // YYYY-MM-DD
  jam_display: string; // HH:mm:ss
  file_name: string; // e.g. "2026-08-22_083000_BIMA.jpg"
  foto_data_url?: string;
  google_drive_folder_url: string;
  drive_file_id?: string;
  drive_file_url?: string;
  upload_status?: 'TERUPLOAD_DRIVE' | 'PENDING' | 'GAGAL';
  status: 'HADIR' | 'SELESAI SHIFT';
  catatan?: string;
}

export const WORKER_ATTENDANCE_DRIVE_URL = 'https://drive.google.com/drive/folders/1B-UgnmWX1zkPjNhy19jVSmrSbnZjr_D5?usp=sharing';

export interface AppSettings {
  store_name: string;
  store_tagline: string;
  store_address: string;
  store_phone: string;
  store_ig: string;
  gas_web_app_url: string;
  rawbt_enabled: boolean;
  print_auto_after_checkout: boolean;
  admin_pin: string;
  logo_url: string;
  saldo_kas_warung?: number;
  enable_konsinyasi?: boolean;
  attendance_drive_url?: string;
}

