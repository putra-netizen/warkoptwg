import { 
  User, 
  Product, 
  TransactionPOS, 
  PemasukanHarian, 
  PengeluaranKulakan, 
  Opex, 
  MitraKonsinyasi, 
  LogKonsinyasi, 
  AppSettings,
  AttendanceLog,
  WORKER_ATTENDANCE_DRIVE_URL
} from '../types';

const STORAGE_KEYS = {
  USERS: 'warkop_twg_users',
  PRODUCTS: 'warkop_twg_products',
  TRANSACTIONS: 'warkop_twg_transactions',
  PEMASUKAN: 'warkop_twg_pemasukan',
  PENGELUARAN: 'warkop_twg_pengeluaran',
  OPEX: 'warkop_twg_opex',
  MITRA: 'warkop_twg_mitra',
  LOG_KONSINYASI: 'warkop_twg_log_konsinyasi',
  SETTINGS: 'warkop_twg_settings',
  CURRENT_USER: 'warkop_twg_current_user',
  SALDO_LOGS: 'warkop_twg_saldo_logs',
  RECENT_CUSTOMERS: 'warkop_twg_recent_customers',
  ATTENDANCE_LOGS: 'warkop_twg_attendance_logs',
};

// Broadcast Channel for Instant Multi-tab / Real-time Live Synchronization
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('warkop_twg_realtime_channel');
  }
} catch {
  // Ignore fallback
}

export const broadcastRealtimeUpdate = (topic: string, payload?: any) => {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ topic, payload, timestamp: Date.now() });
    }
  } catch (err) {
    console.error('BroadcastChannel error:', err);
  }
};


export const DEFAULT_SETTINGS: AppSettings = {
  store_name: 'WARKOP TWG',
  store_tagline: 'Kopi & Indomie Autentik',
  store_address: 'Jl. Pemuda No. 8, Jakarta',
  store_phone: '0812-9876-5432',
  store_ig: '@warkoptwg',
  gas_web_app_url: '',
  rawbt_enabled: true,
  print_auto_after_checkout: true,
  admin_pin: '0808',
  logo_url: 'https://lh3.googleusercontent.com/d/1r2FALNajvsbE5CHp2ObY5fhdfAVMx7ti',
  saldo_kas_warung: 1500000,
  enable_konsinyasi: false,
};

const SEED_USERS: User[] = [
  {
    id: 'u-1',
    username: 'bima',
    role: 'kasir',
    nama: 'BIMA',
    status: 'aktif',
  },
  {
    id: 'u-2',
    username: 'prima',
    role: 'admin',
    nama: 'PRIMA',
    status: 'aktif',
  },
];

const SEED_MITRA: MitraKonsinyasi[] = [
  {
    id: 'mitra-1',
    nama_mitra: 'Mak Nur (Gorengan Hangat)',
    kontak: '0813-1122-3344',
    produk_dititipkan: ['prod-15'],
    skema_bagi_hasil: 'Rp 1.500 Mitra / Rp 500 Warkop (75%)',
    skema_tipe: 'nominal',
    skema_nilai: 1500,
    status: 'aktif',
    rekening_bank: 'BCA 1234567890 a/n Nurhasanah',
  },
  {
    id: 'mitra-2',
    nama_mitra: 'Mba Dini (Risol & Pastel Mayo)',
    kontak: '0857-8899-0011',
    produk_dititipkan: ['prod-16'],
    skema_bagi_hasil: '75% Mitra / 25% Warkop',
    skema_tipe: 'persen',
    skema_nilai: 75,
    status: 'aktif',
    rekening_bank: 'Mandiri 987654321 a/n Dini Lestari',
  },
  {
    id: 'mitra-3',
    nama_mitra: 'Bro Dimas (Dimsum Kukus Premium)',
    kontak: '0821-4455-6677',
    produk_dititipkan: ['prod-17'],
    skema_bagi_hasil: '80% Mitra / 20% Warkop',
    skema_tipe: 'persen',
    skema_nilai: 80,
    status: 'aktif',
    rekening_bank: 'BRI 555666777 a/n Dimas Pratama',
  },
];

const SEED_PRODUCTS: Product[] = [
  // Kopi & Teh
  {
    id: 'prod-1',
    nama_produk: 'Kopi Tubruk TWG',
    kategori: 'Kopi & Teh',
    harga_beli: 2000,
    harga_jual: 5000,
    stok: 120,
    satuan: 'Cangkir',
    is_konsinyasi: false,
    gambar: '☕',
  },
  {
    id: 'prod-2',
    nama_produk: 'Kopi Susu Creamy TWG',
    kategori: 'Kopi & Teh',
    harga_beli: 3500,
    harga_jual: 8000,
    stok: 95,
    satuan: 'Cangkir',
    is_konsinyasi: false,
    gambar: '☕',
  },
  {
    id: 'prod-3',
    nama_produk: 'Es Kopi Gula Aren',
    kategori: 'Kopi & Teh',
    harga_beli: 4000,
    harga_jual: 10000,
    stok: 80,
    satuan: 'Gelas',
    is_konsinyasi: false,
    gambar: '🧋',
  },
  {
    id: 'prod-4',
    nama_produk: 'Es Teh Manis Jumbo',
    kategori: 'Kopi & Teh',
    harga_beli: 1500,
    harga_jual: 5000,
    stok: 200,
    satuan: 'Gelas',
    is_konsinyasi: false,
    gambar: '🍵',
  },
  {
    id: 'prod-5',
    nama_produk: 'Teh Tarik Hangat',
    kategori: 'Kopi & Teh',
    harga_beli: 3000,
    harga_jual: 7000,
    stok: 50,
    satuan: 'Cangkir',
    is_konsinyasi: false,
    gambar: '🍵',
  },

  // Minuman Dingin & Segar
  {
    id: 'prod-6',
    nama_produk: 'Extra Joss Susu (Josu)',
    kategori: 'Minuman Dingin',
    harga_beli: 3500,
    harga_jual: 8000,
    stok: 75,
    satuan: 'Gelas',
    is_konsinyasi: false,
    gambar: '⚡',
  },
  {
    id: 'prod-7',
    nama_produk: 'Kuku Bima Susu (Kusu)',
    kategori: 'Minuman Dingin',
    harga_beli: 3500,
    harga_jual: 8000,
    stok: 60,
    satuan: 'Gelas',
    is_konsinyasi: false,
    gambar: '🍇',
  },
  {
    id: 'prod-8',
    nama_produk: 'Nutrisari Es Jeruk Peras',
    kategori: 'Minuman Dingin',
    harga_beli: 2000,
    harga_jual: 5000,
    stok: 110,
    satuan: 'Gelas',
    is_konsinyasi: false,
    gambar: '🍊',
  },
  {
    id: 'prod-9',
    nama_produk: 'Soda Gembira Nostalgia',
    kategori: 'Minuman Dingin',
    harga_beli: 6000,
    harga_jual: 12000,
    stok: 40,
    satuan: 'Gelas',
    is_konsinyasi: false,
    gambar: '🥤',
  },

  // Indomie & Makanan
  {
    id: 'prod-10',
    nama_produk: 'Indomie Goreng Original',
    kategori: 'Indomie & Mie',
    harga_beli: 3500,
    harga_jual: 8000,
    stok: 85,
    satuan: 'Porsi',
    is_konsinyasi: false,
    gambar: '🍜',
  },
  {
    id: 'prod-11',
    nama_produk: 'Indomie Internet (Telur Kornet)',
    kategori: 'Indomie & Mie',
    harga_beli: 7000,
    harga_jual: 15000,
    stok: 60,
    satuan: 'Porsi',
    is_konsinyasi: false,
    gambar: '🍜',
  },
  {
    id: 'prod-12',
    nama_produk: 'Indomie Kuah Kari Ayam Telur',
    kategori: 'Indomie & Mie',
    harga_beli: 5500,
    harga_jual: 12000,
    stok: 50,
    satuan: 'Porsi',
    is_konsinyasi: false,
    gambar: '🍲',
  },
  {
    id: 'prod-13',
    nama_produk: 'Roti Bakar Coklat Keju',
    kategori: 'Makanan & Toast',
    harga_beli: 6000,
    harga_jual: 14000,
    stok: 35,
    satuan: 'Porsi',
    is_konsinyasi: false,
    gambar: '🍞',
  },
  {
    id: 'prod-14',
    nama_produk: 'Pisang Bakar Coklat Keju',
    kategori: 'Makanan & Toast',
    harga_beli: 5000,
    harga_jual: 13000,
    stok: 25,
    satuan: 'Porsi',
    is_konsinyasi: false,
    gambar: '🍌',
  },

  // Konsinyasi Produk
  {
    id: 'prod-15',
    nama_produk: 'Gorengan Bakwan / Tempe (Mak Nur)',
    kategori: 'Konsinyasi',
    harga_beli: 1500,
    harga_jual: 2000,
    stok: 45,
    satuan: 'Pcs',
    is_konsinyasi: true,
    id_mitra: 'mitra-1',
    skema_mitra_tipe: 'nominal',
    skema_mitra_nilai: 1500,
    gambar: '🥟',
  },
  {
    id: 'prod-16',
    nama_produk: 'Risol Mayo Lumer (Mba Dini)',
    kategori: 'Konsinyasi',
    harga_beli: 3000,
    harga_jual: 4000,
    stok: 28,
    satuan: 'Pcs',
    is_konsinyasi: true,
    id_mitra: 'mitra-2',
    skema_mitra_tipe: 'persen',
    skema_mitra_nilai: 75,
    gambar: '🌯',
  },
  {
    id: 'prod-17',
    nama_produk: 'Dimsum Ayam Kukus (Bro Dimas)',
    kategori: 'Konsinyasi',
    harga_beli: 12000,
    harga_jual: 15000,
    stok: 20,
    satuan: 'Porsi (4 pcs)',
    is_konsinyasi: true,
    id_mitra: 'mitra-3',
    skema_mitra_tipe: 'persen',
    skema_mitra_nilai: 80,
    gambar: '🥢',
  },
  {
    id: 'prod-18',
    nama_produk: 'Kerupuk Kaleng Warkop',
    kategori: 'Snack & Gorengan',
    harga_beli: 1000,
    harga_jual: 2000,
    stok: 60,
    satuan: 'Pcs',
    is_konsinyasi: false,
    gambar: '🍘',
  },
];

const SEED_TRANSACTIONS: TransactionPOS[] = [
  {
    id: 'trx-101',
    no_invoice: 'TWG-20260822-001',
    tanggal: new Date(Date.now() - 3600000 * 4).toISOString(),
    kasir: 'BIMA',
    items: [
      { produk_id: 'prod-2', nama: 'Kopi Susu Creamy TWG', qty: 2, harga: 8000, subtotal: 16000 },
      { produk_id: 'prod-11', nama: 'Indomie Internet (Telur Kornet)', qty: 1, harga: 15000, subtotal: 15000 },
      { produk_id: 'prod-15', nama: 'Gorengan Bakwan / Tempe (Mak Nur)', qty: 3, harga: 2000, subtotal: 6000, is_konsinyasi: true, id_mitra: 'mitra-1' },
    ],
    subtotal: 37000,
    diskon: 0,
    total: 37000,
    metode_bayar: 'TUNAI',
    bayar: 50000,
    kembali: 13000,
    status: 'LUNAS',
    catatan: 'Meja 2',
  },
  {
    id: 'trx-102',
    no_invoice: 'TWG-20260822-002',
    tanggal: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    kasir: 'BIMA',
    items: [
      { produk_id: 'prod-3', nama: 'Es Kopi Gula Aren', qty: 2, harga: 10000, subtotal: 20000 },
      { produk_id: 'prod-16', nama: 'Risol Mayo Lumer (Mba Dini)', qty: 2, harga: 4000, subtotal: 8000, is_konsinyasi: true, id_mitra: 'mitra-2' },
      { produk_id: 'prod-13', nama: 'Roti Bakar Coklat Keju', qty: 1, harga: 14000, subtotal: 14000 },
    ],
    subtotal: 42000,
    diskon: 2000,
    total: 40000,
    metode_bayar: 'QRIS',
    bayar: 40000,
    kembali: 0,
    status: 'LUNAS',
    catatan: 'Meja 5 / Nobar',
  },
];

const SEED_LOG_KONSINYASI: LogKonsinyasi[] = [
  {
    id: 'log-1',
    tanggal: new Date(Date.now() - 3600000 * 4).toISOString(),
    id_mitra: 'mitra-1',
    nama_mitra: 'Mak Nur (Gorengan Hangat)',
    id_produk: 'prod-15',
    nama_produk: 'Gorengan Bakwan / Tempe (Mak Nur)',
    no_invoice: 'TWG-20260822-001',
    qty_terjual: 3,
    total_penjualan: 6000,
    bagian_mitra: 4500,
    bagian_warkop: 1500,
    status_settle: 'BELUM SETTLE',
  },
  {
    id: 'log-2',
    tanggal: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    id_mitra: 'mitra-2',
    nama_mitra: 'Mba Dini (Risol & Pastel Mayo)',
    id_produk: 'prod-16',
    nama_produk: 'Risol Mayo Lumer (Mba Dini)',
    no_invoice: 'TWG-20260822-002',
    qty_terjual: 2,
    total_penjualan: 8000,
    bagian_mitra: 6000,
    bagian_warkop: 2000,
    status_settle: 'BELUM SETTLE',
  },
];

const SEED_PEMASUKAN: PemasukanHarian[] = [
  {
    id: 'in-1',
    tanggal: new Date().toISOString().split('T')[0],
    sumber: 'POS Warkop',
    jumlah: 77000,
    keterangan: 'Omzet POS Otomatis Hari Ini',
    input_by: 'Sistem POS',
  },
];

const SEED_PENGELUARAN: PengeluaranKulakan[] = [
  {
    id: 'out-1',
    tanggal: new Date().toISOString().split('T')[0],
    nama_bahan: 'Biji Kopi Robusta Dampit (2kg)',
    jumlah: 2,
    satuan: 'Kg',
    harga_satuan: 75000,
    total: 150000,
    supplier: 'Toko Kopi Jaya Abadi',
    catatan: 'Stok kopi mingguan',
  },
  {
    id: 'out-2',
    tanggal: new Date().toISOString().split('T')[0],
    nama_bahan: 'Susu Kental Manis Carnation (1 Karton)',
    jumlah: 1,
    satuan: 'Karton (48 klg)',
    harga_satuan: 490000,
    total: 490000,
    supplier: 'Grosir Sembako Berkah',
  },
  {
    id: 'out-3',
    tanggal: new Date().toISOString().split('T')[0],
    nama_bahan: 'Es Batu Balok Kristal',
    jumlah: 4,
    satuan: 'Balok / Karung',
    harga_satuan: 12000,
    total: 48000,
    supplier: 'Depo Es Kristal Pak Kumis',
  },
];

const SEED_OPEX: Opex[] = [
  {
    id: 'op-1',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Listrik',
    nama: 'Token Listrik PLN Warkop',
    jumlah: 200000,
    keterangan: 'Pengisian token 200k',
    is_recurring: true,
  },
  {
    id: 'op-2',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Wifi',
    nama: 'Internet Indihome Warkop 50Mbps',
    jumlah: 350000,
    keterangan: 'Tagihan bulanan WiFi tongkrongan',
    is_recurring: true,
  },
  {
    id: 'op-3',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Gas & Air',
    nama: 'Gas LPG 3kg (2 tabung)',
    jumlah: 44000,
    keterangan: 'Pangkalan Gas Barokah',
    is_recurring: false,
  },
];

// Helper functions for localStorage
export const LocalStorageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    try {
      const parsed: User[] = JSON.parse(data);
      // Normalize user names strictly to BIMA and PRIMA
      return parsed.map((u) => {
        if (u.role === 'admin' || (u.nama && (u.nama.includes('Rian') || u.nama.includes('Bang Rian')))) {
          return { ...u, id: 'u-2', username: 'prima', role: 'admin' as const, nama: 'PRIMA', status: 'aktif' as const };
        }
        if (u.role === 'kasir' || (u.nama && (u.nama.includes('Budi') || u.nama.includes('Santoso')))) {
          return { ...u, id: 'u-1', username: 'bima', role: 'kasir' as const, nama: 'BIMA', status: 'aktif' as const };
        }
        return u;
      });
    } catch {
      return SEED_USERS;
    }
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    }
    try {
      const parsed: Product[] = JSON.parse(data);
      // Normalize any multi-stacked emojis from past sessions
      return parsed.map((p) => {
        let cleanGambar = p.gambar || '☕';
        if (cleanGambar.includes('🥛☕')) cleanGambar = '☕';
        else if (cleanGambar.includes('🧊🍵')) cleanGambar = '🍵';
        else if (cleanGambar.includes('🍳🍜')) cleanGambar = '🍜';
        return { ...p, gambar: cleanGambar };
      });
    } catch {
      return SEED_PRODUCTS;
    }
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getTransactions: (): TransactionPOS[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    }
    return JSON.parse(data);
  },
  saveTransactions: (transactions: TransactionPOS[]) => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    broadcastRealtimeUpdate('TRANSACTIONS_UPDATED', { count: transactions.length });
  },

  getAttendanceLogs: (): AttendanceLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_LOGS);
    if (!data) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = '07:30:00';
      const initialSeed: AttendanceLog[] = [
        {
          id: 'att-1',
          worker_nama: 'BIMA',
          tipe: 'MASUK',
          waktu: `${dateStr}T07:30:00.000Z`,
          tanggal_display: dateStr,
          jam_display: timeStr,
          file_name: `${dateStr}_073000_BIMA.jpg`,
          google_drive_folder_url: WORKER_ATTENDANCE_DRIVE_URL,
          status: 'HADIR',
          catatan: 'Shift Pagi (Buka Warung)',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(initialSeed));
      return initialSeed;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveAttendanceLogs: (logs: AttendanceLog[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(logs));
    broadcastRealtimeUpdate('ATTENDANCE_UPDATED', { count: logs.length });
  },

  addAttendanceLog: (log: AttendanceLog): AttendanceLog[] => {
    const logs = LocalStorageService.getAttendanceLogs();
    const updated = [log, ...logs];
    LocalStorageService.saveAttendanceLogs(updated);
    return updated;
  },

  getPemasukan: (): PemasukanHarian[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PEMASUKAN);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PEMASUKAN, JSON.stringify(SEED_PEMASUKAN));
      return SEED_PEMASUKAN;
    }
    return JSON.parse(data);
  },
  savePemasukan: (pemasukan: PemasukanHarian[]) => {
    localStorage.setItem(STORAGE_KEYS.PEMASUKAN, JSON.stringify(pemasukan));
  },

  getPengeluaran: (): PengeluaranKulakan[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PENGELUARAN);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PENGELUARAN, JSON.stringify(SEED_PENGELUARAN));
      return SEED_PENGELUARAN;
    }
    return JSON.parse(data);
  },
  savePengeluaran: (pengeluaran: PengeluaranKulakan[]) => {
    localStorage.setItem(STORAGE_KEYS.PENGELUARAN, JSON.stringify(pengeluaran));
  },

  getOpex: (): Opex[] => {
    const data = localStorage.getItem(STORAGE_KEYS.OPEX);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.OPEX, JSON.stringify(SEED_OPEX));
      return SEED_OPEX;
    }
    return JSON.parse(data);
  },
  saveOpex: (opex: Opex[]) => {
    localStorage.setItem(STORAGE_KEYS.OPEX, JSON.stringify(opex));
  },

  getMitra: (): MitraKonsinyasi[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MITRA);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MITRA, JSON.stringify(SEED_MITRA));
      return SEED_MITRA;
    }
    return JSON.parse(data);
  },
  saveMitra: (mitra: MitraKonsinyasi[]) => {
    localStorage.setItem(STORAGE_KEYS.MITRA, JSON.stringify(mitra));
  },

  getLogKonsinyasi: (): LogKonsinyasi[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOG_KONSINYASI);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.LOG_KONSINYASI, JSON.stringify(SEED_LOG_KONSINYASI));
      return SEED_LOG_KONSINYASI;
    }
    return JSON.parse(data);
  },
  saveLogKonsinyasi: (logs: LogKonsinyasi[]) => {
    localStorage.setItem(STORAGE_KEYS.LOG_KONSINYASI, JSON.stringify(logs));
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getSaldoLogs: (): import('../types').SaldoLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SALDO_LOGS);
    if (!data) {
      const initialLogs: import('../types').SaldoLog[] = [
        {
          id: 'saldo-init',
          tanggal: new Date().toISOString(),
          tipe: 'SET_SALDO',
          jumlah: 1500000,
          keterangan: 'Modal Kas Awal Warung',
          saldo_akhir: 1500000,
          input_by: 'PRIMA',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.SALDO_LOGS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(data);
  },
  saveSaldoLogs: (logs: import('../types').SaldoLog[]) => {
    localStorage.setItem(STORAGE_KEYS.SALDO_LOGS, JSON.stringify(logs));
  },

  getSaldoWarung: (): number => {
    const settings = LocalStorageService.getSettings();
    return typeof settings.saldo_kas_warung === 'number' ? settings.saldo_kas_warung : 1500000;
  },
  updateSaldoWarung: (
    amount: number,
    keterangan: string,
    inputBy: string = 'PRIMA',
    tipe: 'MASUK' | 'KELUAR' | 'SET_SALDO' = 'MASUK'
  ): number => {
    const currentSaldo = LocalStorageService.getSaldoWarung();
    let newSaldo = currentSaldo;
    if (tipe === 'MASUK') {
      newSaldo = currentSaldo + amount;
    } else if (tipe === 'KELUAR') {
      newSaldo = Math.max(0, currentSaldo - amount);
    } else if (tipe === 'SET_SALDO') {
      newSaldo = amount;
    }

    const settings = LocalStorageService.getSettings();
    settings.saldo_kas_warung = newSaldo;
    LocalStorageService.saveSettings(settings);

    const logs = LocalStorageService.getSaldoLogs();
    const newLog: import('../types').SaldoLog = {
      id: `saldo-${Date.now()}`,
      tanggal: new Date().toISOString(),
      tipe,
      jumlah: amount,
      keterangan,
      saldo_akhir: newSaldo,
      input_by: inputBy,
    };
    LocalStorageService.saveSaldoLogs([newLog, ...logs]);
    return newSaldo;
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      const user: User = JSON.parse(data);
      if (user.role === 'admin' || (user.nama && (user.nama.includes('Rian') || user.nama.includes('Bang Rian')))) {
        return { ...user, id: 'u-2', username: 'prima', role: 'admin' as const, nama: 'PRIMA', status: 'aktif' as const };
      }
      if (user.role === 'kasir' || (user.nama && (user.nama.includes('Budi') || user.nama.includes('Santoso')))) {
        return { ...user, id: 'u-1', username: 'bima', role: 'kasir' as const, nama: 'BIMA', status: 'aktif' as const };
      }
      return user;
    } catch {
      return null;
    }
  },
  saveCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getRecentCustomers: (): string[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_CUSTOMERS);
    if (!data) {
      return ['Mas Danu', 'Pak RT', 'Andi', 'Dimas', 'Bambang', 'Bayu', 'Fajar'];
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addRecentCustomer: (name: string): string[] => {
    const trimmed = name.trim();
    if (!trimmed) return LocalStorageService.getRecentCustomers();

    const existing = LocalStorageService.getRecentCustomers();
    // Filter out existing occurrence case-insensitively, then prepend
    const updated = [trimmed, ...existing.filter((n) => n.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(updated));
    return updated;
  },

  // Reset to initial seed
  resetAllData: () => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.PEMASUKAN, JSON.stringify(SEED_PEMASUKAN));
    localStorage.setItem(STORAGE_KEYS.PENGELUARAN, JSON.stringify(SEED_PENGELUARAN));
    localStorage.setItem(STORAGE_KEYS.OPEX, JSON.stringify(SEED_OPEX));
    localStorage.setItem(STORAGE_KEYS.MITRA, JSON.stringify(SEED_MITRA));
    localStorage.setItem(STORAGE_KEYS.LOG_KONSINYASI, JSON.stringify(SEED_LOG_KONSINYASI));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_LOGS);
  }
};
