import React, { useState, useMemo } from 'react';
import { 
  TransactionPOS, 
  PengeluaranKulakan, 
  Opex, 
  LogKonsinyasi, 
  Product, 
  AppSettings,
  SaldoLog
} from '../types';
import { formatCurrency } from '../services/thermalPrint';
import { LocalStorageService } from '../services/storage';
import { 
  TrendingUp, 
  Wallet, 
  Package, 
  Users2, 
  ArrowUpRight, 
  Flame, 
  Plus, 
  Calendar,
  DollarSign,
  History
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface AdminDashboardProps {
  transactions?: TransactionPOS[];
  pengeluaran?: PengeluaranKulakan[];
  opex?: Opex[];
  logKonsinyasi?: LogKonsinyasi[];
  products?: Product[];
  pemasukan?: any[];
  mitraList?: any[];
  settings: AppSettings;
  onNavigate?: (tab: any) => void;
  onOpenGasModal?: () => void;
  onOpenClosingModal?: () => void;
  onUpdateSaldo?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  transactions = [],
  pengeluaran = [],
  opex = [],
  logKonsinyasi = [],
  products = [],
  settings,
  onNavigate = (_tab: any) => {},
  onOpenGasModal = () => {},
  onUpdateSaldo,
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeLogKonsinyasi = Array.isArray(logKonsinyasi) ? logKonsinyasi : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Product purchase price lookup map for exact margin calculation
  const productPriceMap = useMemo(() => {
    const map = new Map<string, { harga_beli: number; harga_jual: number; is_konsinyasi: boolean }>();
    safeProducts.forEach((p) => {
      map.set(p.id, {
        harga_beli: p.harga_beli || 0,
        harga_jual: p.harga_jual || 0,
        is_konsinyasi: !!p.is_konsinyasi,
      });
    });
    return map;
  }, [safeProducts]);

  // Filter time range: 'today' | 'week' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Saldo Modal State
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
  const [saldoActionType, setSaldoActionType] = useState<'MASUK' | 'KELUAR' | 'SET_SALDO'>('MASUK');
  const [saldoInputAmount, setSaldoInputAmount] = useState<string>('500000');
  const [saldoKeterangan, setSaldoKeterangan] = useState<string>('Top-up Saldo Kas Operasional');
  const [saldoLogs, setSaldoLogs] = useState<SaldoLog[]>(LocalStorageService.getSaldoLogs());
  const currentSaldoKas = LocalStorageService.getSaldoWarung();

  // Current dates & week calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // 'YYYY-MM'

  // Calculate start of current week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter((t) => {
      if (!t.tanggal) return false;
      if (timeFilter === 'today') {
        return t.tanggal.startsWith(todayStr);
      }
      if (timeFilter === 'week') {
        const trxDate = new Date(t.tanggal);
        return trxDate >= startOfWeek;
      }
      if (timeFilter === 'month') {
        return t.tanggal.startsWith(currentMonthStr);
      }
      return true; // 'all'
    });
  }, [safeTransactions, timeFilter, todayStr, currentMonthStr, startOfWeek]);

  // Accurate Profit (Selisih Harga Jual - Harga Beli) & Omzet Calculations
  const metrics = useMemo(() => {
    const lunasTrx = filteredTransactions.filter((t) => t.status === 'LUNAS');
    const totalOmzet = lunasTrx.reduce((sum, t) => sum + (t.total || 0), 0);

    // Calculate pure product gross profit (Laba Produk)
    let totalLabaMargin = 0;
    lunasTrx.forEach((t) => {
      let trxItemProfit = 0;
      (t.items || []).forEach((item) => {
        const prodInfo = productPriceMap.get(item.produk_id);
        const hargaBeli = prodInfo ? prodInfo.harga_beli : 0;
        
        if (item.is_konsinyasi || (prodInfo && prodInfo.is_konsinyasi)) {
          const feeWarkop = Math.max(0, (item.subtotal || item.harga * item.qty) - (item.harga * 0.75 * item.qty));
          trxItemProfit += feeWarkop;
        } else {
          const marginPerItem = (item.harga || 0) - hargaBeli;
          trxItemProfit += marginPerItem * (item.qty || 1);
        }
      });
      const netTrxProfit = Math.max(0, trxItemProfit - (t.diskon || 0));
      totalLabaMargin += netTrxProfit;
    });

    // Consignment pending
    const pendingConsignmentLogs = safeLogKonsinyasi.filter((l) => l.status_settle === 'BELUM SETTLE');
    const pendingConsignmentNominal = pendingConsignmentLogs.reduce(
      (sum, l) => sum + (l.bagian_mitra || 0),
      0
    );

    // Kasbon
    const kasbonCount = filteredTransactions.filter((t) => t.status === 'BELUM BAYAR').length;
    const kasbonNominal = filteredTransactions
      .filter((t) => t.status === 'BELUM BAYAR')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return {
      totalOmzet,
      totalLabaMargin,
      totalTrxCount: lunasTrx.length,
      pendingConsignmentNominal,
      pendingConsignmentCount: pendingConsignmentLogs.length,
      kasbonCount,
      kasbonNominal,
    };
  }, [filteredTransactions, productPriceMap, safeLogKonsinyasi]);

  // Real-time Trend Chart Data: Always Daily (Per Hari)
  const trendData = useMemo(() => {
    // Generate 7 consecutive days up to today or spanning the period
    const daysCount = timeFilter === 'month' ? 7 : 7;
    const days: { label: string; dateStr: string; omzet: number; laba: number }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      const dayTrx = safeTransactions.filter(
        (t) => t.tanggal && t.tanggal.startsWith(dateStr) && t.status === 'LUNAS'
      );
      const dayOmzet = dayTrx.reduce((sum, t) => sum + (t.total || 0), 0);
      const dayLaba = Math.round(dayOmzet * 0.45);

      days.push({ label: dayLabel, dateStr, omzet: dayOmzet, laba: dayLaba });
    }

    return days;
  }, [safeTransactions, timeFilter]);

  const maxTrendOmzet = Math.max(...trendData.map((d) => d.omzet), 100000);

  // Top selling products in selected period
  const topProducts = useMemo(() => {
    const counts: Record<string, { nama: string; qty: number; total: number }> = {};
    filteredTransactions.forEach((t) => {
      (t.items || []).forEach((it) => {
        if (!counts[it.produk_id]) {
          counts[it.produk_id] = { nama: it.nama, qty: 0, total: 0 };
        }
        counts[it.produk_id].qty += it.qty || 0;
        counts[it.produk_id].total += it.subtotal || 0;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredTransactions]);

  const handleSaveSaldoAction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(saldoInputAmount.replace(/\D/g, '')) || 0;
    if (amount <= 0 && saldoActionType !== 'SET_SALDO') return;

    LocalStorageService.updateSaldoWarung(
      amount,
      saldoKeterangan || 'Penyesuaian Saldo Warung',
      'PRIMA',
      saldoActionType
    );
    setSaldoLogs(LocalStorageService.getSaldoLogs());
    setIsSaldoModalOpen(false);
    if (onUpdateSaldo) onUpdateSaldo();
  };

  const isKonsinyasiActive = !!settings.enable_konsinyasi;

  const getPeriodLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Hari Ini';
      case 'week': return 'Minggu Ini';
      case 'month': return 'Bulan Ini';
      case 'all': return 'All Time';
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto font-sans">
      {/* Top Filter Bar with 4 Period Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-700">Filter Periode:</span>
        </div>

        {/* 4 Real-time Pill Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 w-full sm:w-auto overflow-x-auto">
          <button
            id="filter-time-today"
            type="button"
            onClick={() => setTimeFilter('today')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              timeFilter === 'today'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Hari Ini
          </button>

          <button
            id="filter-time-week"
            type="button"
            onClick={() => setTimeFilter('week')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              timeFilter === 'week'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Minggu Ini
          </button>

          <button
            id="filter-time-month"
            type="button"
            onClick={() => setTimeFilter('month')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              timeFilter === 'month'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Bulan Ini
          </button>

          <button
            id="filter-time-all"
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              timeFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isKonsinyasiActive ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {/* Card 1: Omzet Penjualan */}
        <Card className="shadow-xs border-zinc-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-zinc-500">
              Omzet Penjualan
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-zinc-900">
              {formatCurrency(metrics.totalOmzet)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              <span className="text-emerald-600 font-bold">{metrics.totalTrxCount} transaksi</span> lunas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Laba Keuntungan Produk */}
        <Card className="shadow-xs border-zinc-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-zinc-500">
              Laba Produk
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-zinc-900">
              {formatCurrency(metrics.totalLabaMargin)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              Margin murni item terjual (Harga Jual - HPP)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Saldo Kas Warung (Terpisah dari omzet, sumber OPEX/Kulakan) */}
        <Card className="shadow-xs border-zinc-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-zinc-500">Saldo Kas Warung</span>
            <button
              id="btn-manage-saldo-kas"
              onClick={() => {
                setSaldoActionType('MASUK');
                setSaldoInputAmount('500000');
                setSaldoKeterangan('Setor Tambahan Modal Kas');
                setIsSaldoModalOpen(true);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Input Saldo</span>
            </button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-zinc-900">
              {formatCurrency(currentSaldoKas)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              Dana operasional kas warung (Kulakan & Opex)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Hutang Konsinyasi (ONLY shown when consignment toggle is ON) */}
        {isKonsinyasiActive && (
          <Card 
            className="shadow-xs border-zinc-200 bg-white cursor-pointer hover:border-zinc-400 transition-colors"
            onClick={() => onNavigate('consignment')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-zinc-500">Hutang Konsinyasi</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Users2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight text-zinc-900">
                {formatCurrency(metrics.pendingConsignmentNominal)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between font-medium">
                <span>{metrics.pendingConsignmentCount} item belum disettle</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 2-Column Analytics Layout: Daily Sales Trend & Best Selling Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sales Trend Per Day (Clean title, no wordiness) */}
        <Card className="lg:col-span-2 shadow-xs border-zinc-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold">
                Tren Penjualan
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Grafik omzet harian
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-bold">
              7 Hari Terakhir
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="pt-2 pb-2">
              <div className="flex items-end justify-between gap-3 h-52 border-b border-zinc-200 pb-3">
                {trendData.map((d, idx) => {
                  const heightPct = Math.max(10, Math.round((d.omzet / maxTrendOmzet) * 100));
                  const isLatest = idx === trendData.length - 1;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      {/* Tooltip value */}
                      <span className="text-[10px] font-semibold text-zinc-500 opacity-80 group-hover:opacity-100 transition-opacity">
                        {d.omzet > 0 ? Math.round(d.omzet / 1000) + 'k' : '0'}
                      </span>

                      {/* Solid Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[44px] rounded-t-lg transition-all duration-300 ${
                          isLatest
                            ? 'bg-zinc-900 shadow-xs'
                            : 'bg-zinc-200 hover:bg-zinc-700'
                        }`}
                      />

                      {/* Label */}
                      <span
                        className={`text-[10px] text-center leading-tight whitespace-nowrap ${
                          isLatest ? 'text-zinc-900 font-bold' : 'text-zinc-500 font-medium'
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Top Selling Products (Without cliché star icons, using Flame & sleek numbered badges) */}
        <Card className="shadow-xs border-zinc-200 bg-white flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Menu Terlaris</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Berdasarkan porsi terjual ({getPeriodLabel()})
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5 flex-1">
            {topProducts.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-400">
                Belum ada transaksi di periode ini.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center border ${
                      idx === 0
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : idx === 1
                        ? 'bg-zinc-700 text-white border-zinc-700'
                        : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900 line-clamp-1">
                        {p.nama}
                      </h5>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {p.qty} Terjual
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-zinc-900">
                    {formatCurrency(p.total)}
                  </span>
                </div>
              ))
            )}
          </CardContent>

          <div className="p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('products')}
              className="w-full text-xs font-bold gap-1.5 border-zinc-200 cursor-pointer rounded-xl"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kelola Semua Menu & Stok</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Saldo Kas Warung Input/Top-up Modal */}
      {isSaldoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Kelola Saldo Kas Warung</h3>
                <p className="text-xs text-zinc-500">Saldo saat ini: {formatCurrency(currentSaldoKas)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaldoModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSaldoAction} className="space-y-4">
              {/* Type Switcher */}
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

              {/* Nominal Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Nominal (Rupiah):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">Rp</span>
                  <Input
                    type="text"
                    value={
                      saldoInputAmount
                        ? Number(saldoInputAmount.replace(/\D/g, '')).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => setSaldoInputAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="pl-10 h-10 text-sm font-bold rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Keterangan / Catatan:</label>
                <Input
                  type="text"
                  value={saldoKeterangan}
                  onChange={(e) => setSaldoKeterangan(e.target.value)}
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

            {/* Recent Saldo Logs */}
            <div className="border-t border-zinc-100 pt-3 space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-500" />
                Riwayat Perubahan Saldo Terakhir:
              </h4>
              <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs">
                {saldoLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 flex justify-between items-center text-[11px]">
                    <div>
                      <p className="font-bold text-zinc-900">{log.keterangan}</p>
                      <span className="text-zinc-500 text-[10px]">{new Date(log.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${log.tipe === 'KELUAR' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {log.tipe === 'KELUAR' ? '-' : '+'}{formatCurrency(log.jumlah)}
                      </span>
                      <p className="text-[10px] text-zinc-500">Saldo: {formatCurrency(log.saldo_akhir)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
