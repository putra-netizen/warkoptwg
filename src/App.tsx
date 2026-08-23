import React, { useState, useEffect } from 'react';
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
  CartItem,
  SaldoLog,
  AttendanceLog
} from './types';
import { LocalStorageService, DEFAULT_SETTINGS } from './services/storage';
import { ApiService } from './services/api';
import { BrandLogo } from './components/BrandLogo';
import { BottomNavBar, ActiveTabType } from './components/BottomNavBar';
import { POSView } from './components/POSView';
import { ReceiptModal } from './components/ReceiptModal';
import { ClosingShiftModal } from './components/ClosingShiftModal';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductManagement } from './components/ProductManagement';
import { ConsignmentManagement } from './components/ConsignmentManagement';
import { FinancialManagement } from './components/FinancialManagement';
import { WorkerAttendanceLogView } from './components/WorkerAttendanceLogView';
import { AppsScriptModal } from './components/AppsScriptModal';
import { InternalLoginPortal } from './components/InternalLoginPortal';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { formatCurrency } from './services/thermalPrint';
import { 
  FileSpreadsheet, 
  RotateCcw, 
  LogOut, 
  Clock,
  Coffee,
  ShieldCheck,
  Settings,
  X,
  ShoppingBag,
  Users2,
  Wallet,
  ArrowRight,
  Plus,
  Camera,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Global State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<TransactionPOS[]>([]);
  const [pemasukan, setPemasukan] = useState<PemasukanHarian[]>([]);
  const [pengeluaran, setPengeluaran] = useState<PengeluaranKulakan[]>([]);
  const [opex, setOpex] = useState<Opex[]>([]);
  const [mitraList, setMitraList] = useState<MitraKonsinyasi[]>([]);
  const [logKonsinyasi, setLogKonsinyasi] = useState<LogKonsinyasi[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTabType>('pos');
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState<TransactionPOS | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isGlobalSaldoModalOpen, setIsGlobalSaldoModalOpen] = useState(false);

  // Global Saldo Modal Form
  const [saldoActionType, setSaldoActionType] = useState<'MASUK' | 'KELUAR' | 'SET_SALDO'>('MASUK');
  const [saldoNominalStr, setSaldoNominalStr] = useState<string>('500000');
  const [saldoCatatan, setSaldoCatatan] = useState<string>('Setor Saldo Kas');

  // Time ticker
  const [currentTime, setCurrentTime] = useState<string>('');

  const reloadData = () => {
    setUsers(LocalStorageService.getUsers());
    setSettings(LocalStorageService.getSettings());
    setProducts(LocalStorageService.getProducts());
    setTransactions(LocalStorageService.getTransactions());
    setPemasukan(LocalStorageService.getPemasukan());
    setPengeluaran(LocalStorageService.getPengeluaran());
    setOpex(LocalStorageService.getOpex());
    setMitraList(LocalStorageService.getMitra());
    setLogKonsinyasi(LocalStorageService.getLogKonsinyasi());
    setAttendanceLogs(LocalStorageService.getAttendanceLogs());
  };

  useEffect(() => {
    const cur = LocalStorageService.getCurrentUser();
    reloadData();
    setCurrentUser(cur);

    if (cur?.role === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('pos');
    }

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 30000);

    // Multi-tab BroadcastChannel & storage listeners for live real-time sync
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('warkop_twg_realtime_channel');
        channel.onmessage = () => {
          reloadData();
        };
      }
    } catch {
      // Ignore
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('warkop_twg_')) {
        reloadData();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Periodic quick poller for real-time transactions & attendance without page refresh
    const pollInterval = setInterval(() => {
      const latestTrx = LocalStorageService.getTransactions();
      setTransactions((prev) => {
        if (latestTrx.length !== prev.length || (latestTrx[0]?.id !== prev[0]?.id)) {
          return latestTrx;
        }
        return prev;
      });
      const latestAtt = LocalStorageService.getAttendanceLogs();
      setAttendanceLogs((prev) => {
        if (latestAtt.length !== prev.length || (latestAtt[0]?.id !== prev[0]?.id)) {
          return latestAtt;
        }
        return prev;
      });
    }, 2000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageEvent);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  // Handlers for POS & Transactions
  const handleCheckoutComplete = async (transaction: TransactionPOS) => {
    await ApiService.createTransaction(transaction, settings);
    reloadData();

    // Update Pemasukan Harian
    if (transaction.status === 'LUNAS') {
      const todayStr = new Date().toISOString().split('T')[0];
      const pemList = LocalStorageService.getPemasukan();
      const existingToday = pemList.find(
        (p) => p.tanggal === todayStr && p.sumber === 'POS Warkop'
      );
      if (existingToday) {
        existingToday.jumlah += transaction.total;
        LocalStorageService.savePemasukan(pemList);
      } else {
        const newPem: PemasukanHarian = {
          id: 'in-' + Date.now(),
          tanggal: todayStr,
          sumber: 'POS Warkop',
          jumlah: transaction.total,
          keterangan: 'Omzet POS Harian Otomatis',
          input_by: currentUser?.nama || 'BIMA',
        };
        LocalStorageService.savePemasukan([newPem, ...pemList]);
      }
      setPemasukan(LocalStorageService.getPemasukan());
    }

    setSelectedReceiptTrx(transaction);
    setIsReceiptModalOpen(true);
  };

  const handleUpdateTransactionStatus = (
    transactionId: string,
    newStatus: 'LUNAS' | 'BELUM BAYAR'
  ) => {
    const updated = transactions.map((t) => {
      if (t.id === transactionId) {
        return { ...t, status: newStatus, bayar: newStatus === 'LUNAS' ? t.total : 0 };
      }
      return t;
    });
    LocalStorageService.saveTransactions(updated);
    setTransactions(updated);
  };

  const handleReprintReceipt = (transaction: TransactionPOS) => {
    setSelectedReceiptTrx(transaction);
    setIsReceiptModalOpen(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const updated = transactions.filter((t) => t.id !== transactionId);
    LocalStorageService.saveTransactions(updated);
    setTransactions(updated);
  };

  // Product CRUD
  const handleSaveProduct = async (product: Product) => {
    await ApiService.saveProduct(product, settings);
    setProducts(LocalStorageService.getProducts());
  };

  const handleDeleteProduct = async (productId: string) => {
    await ApiService.deleteProduct(productId, settings);
    setProducts(LocalStorageService.getProducts());
  };

  // Mitra CRUD & Settlement
  const handleSaveMitra = async (mitra: MitraKonsinyasi) => {
    await ApiService.saveMitra(mitra, settings);
    setMitraList(LocalStorageService.getMitra());
  };

  const handleSettleLogs = async (logIds: string[]) => {
    await ApiService.settleConsignmentLogs(logIds, settings);
    setLogKonsinyasi(LocalStorageService.getLogKonsinyasi());
  };

  // Finances
  const handleAddPemasukan = async (item: PemasukanHarian) => {
    await ApiService.addPemasukan(item, settings);
    setPemasukan(LocalStorageService.getPemasukan());
  };

  const handleAddPengeluaran = async (item: PengeluaranKulakan) => {
    await ApiService.addPengeluaranKulakan(item, settings);
    setPengeluaran(LocalStorageService.getPengeluaran());
  };

  const handleAddOpex = async (item: Opex) => {
    await ApiService.addOpex(item, settings);
    setOpex(LocalStorageService.getOpex());
  };

  // Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    LocalStorageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Navigation handlers
  const handleSelectTab = (tab: ActiveTabType) => {
    if (tab === 'closing') {
      setIsClosingModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    LocalStorageService.saveCurrentUser(user);

    if (user.role === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    setIsClosingModalOpen(false);
    setIsAdminSettingsOpen(false);
    setCurrentUser(null);
    LocalStorageService.saveCurrentUser(null);
  };

  const handleConfirmCloseShift = (rekapData: {
    totalOmzet: number;
    totalTunai: number;
    totalQris: number;
    totalKasbon: number;
    uangFisikLaci: number;
    selisih: number;
    catatan?: string;
  }) => {
    // 1. Masukkan uang fisik/setoran kasir ke Saldo Kas Warung
    if (rekapData.uangFisikLaci > 0) {
      LocalStorageService.updateSaldoWarung(
        rekapData.uangFisikLaci,
        `Tutup Shift Kasir (${currentUser?.nama || 'BIMA'}) - Omzet Tunai Rp ${rekapData.totalTunai.toLocaleString('id-ID')}${
          rekapData.catatan ? ` - Catatan: ${rekapData.catatan}` : ''
        }`,
        currentUser?.nama || 'BIMA',
        'MASUK'
      );
    }

    // 2. Catat Log Absen Keluar (Tanpa wajib selfie foto)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const timeCode = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const workerName = currentUser?.nama || 'BIMA';

    const outLog: AttendanceLog = {
      id: 'att-out-' + Date.now(),
      worker_nama: workerName,
      worker_id: currentUser?.id || 'u-1',
      tipe: 'KELUAR',
      waktu: now.toISOString(),
      tanggal_display: dateStr,
      jam_display: timeStr,
      file_name: `${dateStr}_${timeCode}_${workerName}_OUT`,
      google_drive_folder_url: 'https://drive.google.com/drive/folders/1B-UgnmWX1zkPjNhy19jVSmrSbnZjr_D5?usp=sharing',
      status: 'SELESAI SHIFT',
      catatan: rekapData.catatan || `Tutup Shift. Setoran Kas: Rp ${rekapData.uangFisikLaci.toLocaleString('id-ID')}`,
    };
    LocalStorageService.addAttendanceLog(outLog);

    reloadData();
    handleLogout();
  };

  const handleResetData = () => {
    if (
      confirm(
        'Kembalikan data ke awal (Reset Demo Warkop TWG)? Semua perubahan lokal akan di-reset.'
      )
    ) {
      LocalStorageService.resetAllData();
      window.location.reload();
    }
  };

  const handleGlobalSaldoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(saldoNominalStr.replace(/\D/g, '')) || 0;
    if (amount <= 0 && saldoActionType !== 'SET_SALDO') return;

    LocalStorageService.updateSaldoWarung(
      amount,
      saldoCatatan || 'Penyesuaian Saldo Warung',
      currentUser?.nama || 'PRIMA',
      saldoActionType
    );
    reloadData();
    setIsGlobalSaldoModalOpen(false);
  };

  // If no user is logged in, show the 2-choice entry portal
  if (!currentUser) {
    return (
      <InternalLoginPortal
        onLogin={handleLoginSuccess}
        settings={settings}
        users={users}
      />
    );
  }

  const isOwner = currentUser.role === 'admin';
  const cartItemsCount = cart.reduce((sum, it) => sum + it.qty, 0);
  const currentSaldoKas = LocalStorageService.getSaldoWarung();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      
      {/* Clean Solid App Header (No Redundant Texts, Only Brand Logo) */}
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo only (NO text next to or under it) */}
          <div className="flex items-center select-none cursor-pointer" onClick={() => setActiveTab(isOwner ? 'dashboard' : 'pos')}>
            <BrandLogo size="md" />
          </div>

          {/* Center Info: Live clock */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-semibold border border-zinc-200">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Right User & Settings / Logout */}
          <div className="flex items-center gap-2">
            {/* User Pill */}
            <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200">
              <span className="text-xs font-black text-zinc-900">
                {currentUser.nama}
              </span>
              <Button
                variant="ghost"
                size="icon"
                id="btn-logout-header"
                onClick={handleLogout}
                className="h-6 w-6 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Admin Settings Icon (Top Right Icon Trigger) */}
            {isOwner && (
              <Button
                variant="outline"
                size="icon"
                id="btn-open-admin-settings-topright"
                onClick={() => setIsAdminSettingsOpen(true)}
                className="h-8 w-8 rounded-xl border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 cursor-pointer"
                title="Pengaturan & Menu Admin"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            cart={cart}
            setCart={setCart}
            settings={settings}
            currentUser={currentUser}
            onCheckoutComplete={handleCheckoutComplete}
            onCheckout={handleCheckoutComplete}
            onOpenClosingModal={() => setIsClosingModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistoryView
            transactions={transactions}
            settings={settings}
            userRole={currentUser.role}
            onReprintReceipt={handleReprintReceipt}
            onUpdateTransactionStatus={handleUpdateTransactionStatus}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'dashboard' && isOwner && (
          <AdminDashboard
            transactions={transactions}
            pengeluaran={pengeluaran}
            opex={opex}
            logKonsinyasi={logKonsinyasi}
            products={products}
            pemasukan={pemasukan}
            mitraList={mitraList}
            settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenGasModal={() => setIsGasModalOpen(true)}
            onOpenClosingModal={() => setIsClosingModalOpen(true)}
            onUpdateSaldo={reloadData}
          />
        )}

        {activeTab === 'products' && isOwner && (
          <ProductManagement
            products={products}
            mitraList={mitraList}
            settings={settings}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'consignment' && isOwner && (
          <ConsignmentManagement
            mitraList={mitraList}
            logKonsinyasi={logKonsinyasi}
            products={products}
            settings={settings}
            onSaveMitra={handleSaveMitra}
            onSettleLogs={handleSettleLogs}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'finances' && isOwner && (
          <FinancialManagement
            pemasukan={pemasukan}
            pengeluaran={pengeluaran}
            opex={opex}
            settings={settings}
            currentUser={currentUser}
            onAddPemasukan={handleAddPemasukan}
            onAddPengeluaran={handleAddPengeluaran}
            onAddOpex={handleAddOpex}
            onUpdateSaldo={reloadData}
          />
        )}

        {activeTab === 'attendance' && isOwner && (
          <WorkerAttendanceLogView
            logs={attendanceLogs}
            settings={settings}
            onUpdateLogs={(updated) => {
              setAttendanceLogs(updated);
            }}
            onDeleteLog={(id) => {
              const updated = attendanceLogs.filter((l) => l.id !== id);
              LocalStorageService.saveAttendanceLogs(updated);
              setAttendanceLogs(updated);
            }}
            onOpenGasModal={() => setIsGasModalOpen(true)}
            onBack={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        userRole={currentUser.role}
        cartCount={cartItemsCount}
      />

      {/* Slide-Over Settings Drawer (Admin Top Right Trigger) */}
      <AnimatePresence>
        {isAdminSettingsOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 transition-opacity"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white border-l border-zinc-200 h-full shadow-2xl z-10 flex flex-col justify-between p-5 font-sans overflow-y-auto"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-zinc-900 text-white">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">Pengaturan & Menu</h3>
                      <p className="text-[11px] text-zinc-500">Admin PRIMA</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAdminSettingsOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Shortcuts & Tools */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block px-1">
                    Pengaturan Fitur & Mode:
                  </span>

                  {/* Mode Konsinyasi Passive Toggle */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                          <Users2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900">Mode Konsinyasi</h4>
                          <p className="text-[10px] text-zinc-500">
                            {settings.enable_konsinyasi ? 'Aktif (Card Mitra Muncul)' : 'Non-Aktif (Pasif)'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!settings.enable_konsinyasi}
                        onClick={() => {
                          const updated = { ...settings, enable_konsinyasi: !settings.enable_konsinyasi };
                          handleSaveSettings(updated);
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          settings.enable_konsinyasi ? 'bg-zinc-900' : 'bg-zinc-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            settings.enable_konsinyasi ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block px-1 pt-2">
                    Akses Menu Khusus:
                  </span>

                  {/* 1. Buka Mode ORDER (Kasir POS) */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('pos');
                      setIsAdminSettingsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">Buka Mode ORDER (Kasir)</h4>
                        <p className="text-[10px] text-zinc-500">Masuk ke kasir input pesanan</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* 2. Bagi Hasil Konsinyasi Mitra (Shown if enabled) */}
                  {settings.enable_konsinyasi && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('consignment');
                        setIsAdminSettingsOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                          <Users2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900">Bagi Hasil Konsinyasi</h4>
                          <p className="text-[10px] text-zinc-500">Kelola mitra titipan & settlement</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}

                  {/* 3. Kelola Saldo Kas Warung */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminSettingsOpen(false);
                      setIsGlobalSaldoModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">Kelola Saldo Kas Warung</h4>
                        <p className="text-[10px] text-blue-700 font-semibold">{formatCurrency(currentSaldoKas)}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* 4. Log Absen Worker (Selfie & Masuk/Keluar) */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('attendance');
                      setIsAdminSettingsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900">Log Absen Worker</h4>
                          <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 text-[10px] font-extrabold rounded-full">
                            {attendanceLogs.length}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Presensi selfie BIMA & jam masuk</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* 5. Hubungkan Google Spreadsheet */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminSettingsOpen(false);
                      setIsGasModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">Integrasi Google Spreadsheet</h4>
                        <p className="text-[10px] text-zinc-500">
                          {settings.gas_web_app_url ? 'Google Sheets Terhubung' : 'Belum Terhubung'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-zinc-200 space-y-2">
                <Button
                  variant="outline"
                  onClick={handleResetData}
                  className="w-full text-xs font-bold gap-2 text-zinc-700 hover:text-zinc-950 border-zinc-200 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Demo Warkop TWG</span>
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full text-xs font-bold gap-2 rounded-xl cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun PRIMA</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Saldo Kas Warung Modal */}
      {isGlobalSaldoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Kelola Saldo Kas Warung</h3>
                <p className="text-xs text-zinc-500">Saldo saat ini: {formatCurrency(currentSaldoKas)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalSaldoModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGlobalSaldoSubmit} className="space-y-4">
              <div className="grid grid-cols-3 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSaldoActionType('MASUK')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    saldoActionType === 'MASUK' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                  }`}
                >
                  + Tambah Saldo
                </button>
                <button
                  type="button"
                  onClick={() => setSaldoActionType('KELUAR')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    saldoActionType === 'KELUAR' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                  }`}
                >
                  - Tarik Saldo
                </button>
                <button
                  type="button"
                  onClick={() => setSaldoActionType('SET_SALDO')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    saldoActionType === 'SET_SALDO' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                  }`}
                >
                  Atur Saldo
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Nominal (Rupiah):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">Rp</span>
                  <Input
                    type="text"
                    value={
                      saldoNominalStr
                        ? Number(saldoNominalStr.replace(/\D/g, '')).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => setSaldoNominalStr(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 h-10 text-xs font-bold rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Keterangan Mutasi:</label>
                <Input
                  type="text"
                  value={saldoCatatan}
                  onChange={(e) => setSaldoCatatan(e.target.value)}
                  placeholder="Misal: Tambahan Modal Kas / Tarik Setoran"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGlobalSaldoModalOpen(false)}
                  className="flex-1 text-xs font-bold rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Saldo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Thermal Receipt Modal */}
      {selectedReceiptTrx && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          transaction={selectedReceiptTrx}
          settings={settings}
        />
      )}

      {/* Shift Closing & Summary Modal */}
      <ClosingShiftModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        transactions={transactions}
        settings={settings}
        currentUser={currentUser}
        onConfirmCloseShift={handleConfirmCloseShift}
      />

      {/* Google Sheets / Apps Script Integration Modal */}
      <AppsScriptModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
