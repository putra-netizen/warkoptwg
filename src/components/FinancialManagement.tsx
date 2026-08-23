import React, { useState, useMemo } from 'react';
import { 
  PemasukanHarian, 
  PengeluaranKulakan, 
  Opex, 
  OpexCategory, 
  AppSettings, 
  User,
  SaldoLog
} from '../types';
import { formatCurrency, formatDate } from '../services/thermalPrint';
import { LocalStorageService } from '../services/storage';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Receipt, 
  Calendar, 
  Check, 
  X,
  History,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface FinancialManagementProps {
  pemasukan?: PemasukanHarian[];
  pengeluaran?: PengeluaranKulakan[];
  opex?: Opex[];
  settings: AppSettings;
  currentUser: User | null;
  onAddPemasukan: (item: PemasukanHarian) => void;
  onAddPengeluaran: (item: PengeluaranKulakan) => void;
  onAddOpex: (item: Opex) => void;
  onUpdateSaldo?: () => void;
}

const OPEX_CATEGORIES: OpexCategory[] = [
  'Gaji',
  'Sewa',
  'Listrik',
  'Wifi',
  'Gas & Air',
  'Maintenance',
  'Lainnya',
];

export const FinancialManagement: React.FC<FinancialManagementProps> = ({
  pemasukan = [],
  pengeluaran = [],
  opex = [],
  settings,
  currentUser,
  onAddPemasukan,
  onAddPengeluaran,
  onAddOpex,
  onUpdateSaldo,
}) => {
  const safePemasukan = Array.isArray(pemasukan) ? pemasukan : [];
  const safePengeluaran = Array.isArray(pengeluaran) ? pengeluaran : [];
  const safeOpex = Array.isArray(opex) ? opex : [];

  const [activeTab, setActiveTab] = useState<'kulakan' | 'opex' | 'saldo_logs' | 'pemasukan'>('kulakan');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);

  // Form states - Kulakan
  const [namaBahan, setNamaBahan] = useState('');
  const [jumlahBahanStr, setJumlahBahanStr] = useState<string>('1');
  const [satuanBahan, setSatuanBahan] = useState('Kg');
  const [hargaSatuanStr, setHargaSatuanStr] = useState<string>('50000');
  const [supplier, setSupplier] = useState('');

  // Form states - Opex
  const [opexKategori, setOpexKategori] = useState<OpexCategory>('Listrik');
  const [opexNama, setOpexNama] = useState('');
  const [opexJumlahStr, setOpexJumlahStr] = useState<string>('100000');
  const [opexKeterangan, setOpexKeterangan] = useState('');
  const [opexRecurring, setOpexRecurring] = useState(false);

  // Form states - Pemasukan Manual
  const [pemasukanSumber, setPemasukanSumber] = useState<'Manual' | 'Catering' | 'Lainnya'>('Manual');
  const [pemasukanJumlahStr, setPemasukanJumlahStr] = useState<string>('50000');
  const [pemasukanKeterangan, setPemasukanKeterangan] = useState('');

  // Saldo Warung Management Form
  const [saldoActionType, setSaldoActionType] = useState<'MASUK' | 'KELUAR' | 'SET_SALDO'>('MASUK');
  const [saldoNominalStr, setSaldoNominalStr] = useState<string>('500000');
  const [saldoCatatan, setSaldoCatatan] = useState<string>('Setor Modal Kas');
  const [saldoLogs, setSaldoLogs] = useState<SaldoLog[]>(LocalStorageService.getSaldoLogs());
  const currentSaldoKas = LocalStorageService.getSaldoWarung();

  // Summary Totals
  const totals = useMemo(() => {
    const totalPemasukan = safePemasukan.reduce((sum, p) => sum + (p.jumlah || 0), 0);
    const totalKulakan = safePengeluaran.reduce((sum, k) => sum + (k.total || 0), 0);
    const totalOpex = safeOpex.reduce((sum, o) => sum + (o.jumlah || 0), 0);
    const totalPengeluaran = totalKulakan + totalOpex;

    return { totalPemasukan, totalKulakan, totalOpex, totalPengeluaran };
  }, [safePemasukan, safePengeluaran, safeOpex]);

  const handleOpenAdd = () => {
    setNamaBahan('');
    setJumlahBahanStr('1');
    setSatuanBahan('Pcs');
    setHargaSatuanStr('20000');
    setSupplier('');

    setOpexKategori('Listrik');
    setOpexNama('');
    setOpexJumlahStr('100000');
    setOpexKeterangan('');
    setOpexRecurring(false);

    setPemasukanSumber('Manual');
    setPemasukanJumlahStr('50000');
    setPemasukanKeterangan('');

    setIsModalOpen(true);
  };

  const handleKulakanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBahan.trim()) return;

    const jQty = Number(jumlahBahanStr.replace(/\D/g, '')) || 1;
    const hSatuan = Number(hargaSatuanStr.replace(/\D/g, '')) || 0;
    const totalCost = jQty * hSatuan;

    const newItem: PengeluaranKulakan = {
      id: 'out-' + Date.now(),
      tanggal: new Date().toISOString().split('T')[0],
      nama_bahan: namaBahan.trim(),
      jumlah: jQty,
      satuan: satuanBahan.trim() || 'Pcs',
      harga_satuan: hSatuan,
      total: totalCost,
      supplier: supplier.trim() || 'Pasar Tradisional / Grosir',
    };

    // Deduct cost from Saldo Kas Warung
    LocalStorageService.updateSaldoWarung(
      totalCost,
      `Kulakan: ${namaBahan.trim()} (${jQty} ${satuanBahan})`,
      currentUser?.nama || 'PRIMA',
      'KELUAR'
    );
    setSaldoLogs(LocalStorageService.getSaldoLogs());

    onAddPengeluaran(newItem);
    setIsModalOpen(false);
    if (onUpdateSaldo) onUpdateSaldo();
  };

  const handleOpexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opexNama.trim()) return;

    const cost = Number(opexJumlahStr.replace(/\D/g, '')) || 0;

    const newItem: Opex = {
      id: 'op-' + Date.now(),
      tanggal: new Date().toISOString().split('T')[0],
      kategori: opexKategori,
      nama: opexNama.trim(),
      jumlah: cost,
      keterangan: opexKeterangan.trim(),
      is_recurring: opexRecurring,
    };

    // Deduct opex from Saldo Kas Warung
    LocalStorageService.updateSaldoWarung(
      cost,
      `OPEX [${opexKategori}]: ${opexNama.trim()}`,
      currentUser?.nama || 'PRIMA',
      'KELUAR'
    );
    setSaldoLogs(LocalStorageService.getSaldoLogs());

    onAddOpex(newItem);
    setIsModalOpen(false);
    if (onUpdateSaldo) onUpdateSaldo();
  };

  const handlePemasukanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(pemasukanJumlahStr.replace(/\D/g, '')) || 0;
    if (!amount) return;

    const newItem: PemasukanHarian = {
      id: 'in-' + Date.now(),
      tanggal: new Date().toISOString().split('T')[0],
      sumber: pemasukanSumber,
      jumlah: amount,
      keterangan: pemasukanKeterangan.trim() || 'Pemasukan tambahan manual',
      input_by: currentUser?.nama || 'PRIMA',
    };

    onAddPemasukan(newItem);
    setIsModalOpen(false);
  };

  const handleSaldoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(saldoNominalStr.replace(/\D/g, '')) || 0;
    if (amount <= 0 && saldoActionType !== 'SET_SALDO') return;

    LocalStorageService.updateSaldoWarung(
      amount,
      saldoCatatan || 'Penyesuaian Saldo Warung',
      currentUser?.nama || 'PRIMA',
      saldoActionType
    );
    setSaldoLogs(LocalStorageService.getSaldoLogs());
    setIsSaldoModalOpen(false);
    if (onUpdateSaldo) onUpdateSaldo();
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            <span>Arus Kas & Pengeluaran Operasional</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pengeluaran kulakan & OPEX dipotong langsung dari Saldo Kas Warung
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setSaldoActionType('MASUK');
              setSaldoNominalStr('500000');
              setSaldoCatatan('Top-up Modal Kas Warung');
              setIsSaldoModalOpen(true);
            }}
            variant="outline"
            className="text-xs font-bold gap-1.5 h-9 px-3.5 rounded-xl border-zinc-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Input Saldo Kas</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold gap-1.5 h-9 px-4 rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {activeTab === 'kulakan'
                ? 'Catat Belanja Kulakan'
                : activeTab === 'opex'
                ? 'Catat Biaya Opex'
                : 'Tambah Data'}
            </span>
          </Button>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Saldo Kas Warung */}
        <Card className="shadow-xs border-blue-200 bg-blue-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Saldo Kas Warung
              </span>
              <div className="text-2xl font-black tracking-tight text-blue-900 mt-1">
                {formatCurrency(currentSaldoKas)}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold">
                Sumber dana belanja kulakan & opex
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Belanja Kulakan */}
        <Card className="shadow-xs border-zinc-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Belanja Kulakan
              </span>
              <div className="text-2xl font-black tracking-tight text-zinc-900 mt-1">
                {formatCurrency(totals.totalKulakan)}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">
                {safePengeluaran.length} transaksi belanja bahan
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Biaya Opex */}
        <Card className="shadow-xs border-zinc-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Biaya Opex
              </span>
              <div className="text-2xl font-black tracking-tight text-rose-600 mt-1">
                {formatCurrency(totals.totalOpex)}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">
                Listrik, wifi, gas, sewa & gaji
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-2xl border border-zinc-200 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('kulakan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'kulakan' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Belanja Kulakan ({safePengeluaran.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('opex')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'opex' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Biaya OPEX ({safeOpex.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saldo_logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'saldo_logs' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Log Mutasi Saldo Kas ({saldoLogs.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
          {activeTab === 'kulakan' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 border-b border-zinc-200">
                  <TableHead className="text-xs font-bold text-zinc-700 w-[120px]">Tanggal</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Nama Bahan Baku</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Kuantitas</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700 text-right">Harga Satuan</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700 text-right">Total Biaya</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Supplier / Toko</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safePengeluaran.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-zinc-400 text-xs">
                      Belum ada catatan belanja kulakan.
                    </TableCell>
                  </TableRow>
                ) : (
                  safePengeluaran.map((item) => (
                    <TableRow key={item.id} className="hover:bg-zinc-50 border-b border-zinc-100">
                      <TableCell className="text-xs text-zinc-500 font-semibold">{formatDate(item.tanggal)}</TableCell>
                      <TableCell className="text-xs font-bold text-zinc-900">{item.nama_bahan}</TableCell>
                      <TableCell className="text-xs text-zinc-700 font-semibold">{item.jumlah} {item.satuan}</TableCell>
                      <TableCell className="text-xs text-right text-zinc-600">{formatCurrency(item.harga_satuan)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-rose-600">-{formatCurrency(item.total)}</TableCell>
                      <TableCell className="text-xs text-zinc-600">{item.supplier}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === 'opex' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 border-b border-zinc-200">
                  <TableHead className="text-xs font-bold text-zinc-700 w-[120px]">Tanggal</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Kategori</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Nama Pengeluaran</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Keterangan</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700 text-right">Jumlah Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeOpex.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-zinc-400 text-xs">
                      Belum ada catatan biaya operasional (OPEX).
                    </TableCell>
                  </TableRow>
                ) : (
                  safeOpex.map((item) => (
                    <TableRow key={item.id} className="hover:bg-zinc-50 border-b border-zinc-100">
                      <TableCell className="text-xs text-zinc-500 font-semibold">{formatDate(item.tanggal)}</TableCell>
                      <TableCell className="text-xs font-bold text-zinc-900">
                        <Badge variant="outline" className="text-[11px] font-bold">{item.kategori}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-zinc-900">{item.nama}</TableCell>
                      <TableCell className="text-xs text-zinc-600">{item.keterangan || '-'}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-rose-600">-{formatCurrency(item.jumlah)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === 'saldo_logs' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 border-b border-zinc-200">
                  <TableHead className="text-xs font-bold text-zinc-700 w-[140px]">Waktu</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Aktivitas</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Keterangan</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700 text-right">Mutasi</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700 text-right">Sisa Saldo Kas</TableHead>
                  <TableHead className="text-xs font-bold text-zinc-700">Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldoLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-zinc-400 text-xs">
                      Belum ada catatan mutasi saldo.
                    </TableCell>
                  </TableRow>
                ) : (
                  saldoLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-zinc-50 border-b border-zinc-100">
                      <TableCell className="text-xs text-zinc-500 font-semibold">
                        {new Date(log.tanggal).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        <Badge
                          variant={log.tipe === 'KELUAR' ? 'destructive' : 'default'}
                          className="text-[10px] font-bold"
                        >
                          {log.tipe}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-zinc-900">{log.keterangan}</TableCell>
                      <TableCell className={`text-xs text-right font-bold ${log.tipe === 'KELUAR' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {log.tipe === 'KELUAR' ? '-' : '+'}{formatCurrency(log.jumlah)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-zinc-900">
                        {formatCurrency(log.saldo_akhir)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 font-semibold">{log.input_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Modal Add Kulakan / Opex */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                {activeTab === 'kulakan' ? 'Catat Belanja Kulakan' : 'Catat Biaya OPEX'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {activeTab === 'kulakan' ? (
              <form onSubmit={handleKulakanSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Nama Bahan Baku:</label>
                  <Input
                    type="text"
                    value={namaBahan}
                    onChange={(e) => setNamaBahan(e.target.value)}
                    placeholder="Contoh: Kopi Robusta Lampung 1kg"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Jumlah:</label>
                    <Input
                      type="text"
                      value={
                        jumlahBahanStr
                          ? Number(jumlahBahanStr.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => setJumlahBahanStr(e.target.value.replace(/\D/g, ''))}
                      className="h-10 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Satuan:</label>
                    <Input
                      type="text"
                      value={satuanBahan}
                      onChange={(e) => setSatuanBahan(e.target.value)}
                      placeholder="Kg / Pcs / Dus"
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Harga Satuan (Rupiah):</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">Rp</span>
                    <Input
                      type="text"
                      value={
                        hargaSatuanStr
                          ? Number(hargaSatuanStr.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => setHargaSatuanStr(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-10 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Supplier / Toko:</label>
                  <Input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Contoh: Toko Grosir Jaya"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <p className="text-[11px] text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  Total biaya akan otomatis dipotong dari Saldo Kas Warung.
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 text-xs font-bold rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl"
                  >
                    Simpan Kulakan
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOpexSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Kategori OPEX:</label>
                  <select
                    value={opexKategori}
                    onChange={(e) => setOpexKategori(e.target.value as OpexCategory)}
                    className="h-10 w-full px-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-800"
                  >
                    {OPEX_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Nama Pengeluaran:</label>
                  <Input
                    type="text"
                    value={opexNama}
                    onChange={(e) => setOpexNama(e.target.value)}
                    placeholder="Contoh: Token Listrik 100k"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Jumlah Biaya (Rupiah):</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">Rp</span>
                    <Input
                      type="text"
                      value={
                        opexJumlahStr
                          ? Number(opexJumlahStr.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => setOpexJumlahStr(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-10 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Keterangan:</label>
                  <Input
                    type="text"
                    value={opexKeterangan}
                    onChange={(e) => setOpexKeterangan(e.target.value)}
                    placeholder="Keterangan tambahan"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <p className="text-[11px] text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  Biaya OPEX dipotong dari Saldo Kas Warung (tanpa menyentuh omzet harian).
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 text-xs font-bold rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl"
                  >
                    Simpan OPEX
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Input/Top-up Saldo Warung */}
      {isSaldoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Kelola Saldo Kas Warung</h3>
                <p className="text-xs text-zinc-500">Saldo saat ini: {formatCurrency(currentSaldoKas)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaldoModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaldoSubmit} className="space-y-4">
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
                  onClick={() => setIsSaldoModalOpen(false)}
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
    </div>
  );
};
