import React, { useState, useMemo } from 'react';
import { MitraKonsinyasi, LogKonsinyasi, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../services/thermalPrint';
import { 
  Users2, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Check, 
  X, 
  Phone, 
  CreditCard, 
  Printer, 
  DollarSign,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface ConsignmentManagementProps {
  mitraList?: MitraKonsinyasi[];
  logKonsinyasi?: LogKonsinyasi[];
  products?: any[];
  settings: AppSettings;
  onSaveMitra: (mitra: MitraKonsinyasi) => void;
  onSettleLogs: (logIds: string[]) => void;
  onBack?: () => void;
}

export const ConsignmentManagement: React.FC<ConsignmentManagementProps> = ({
  mitraList = [],
  logKonsinyasi = [],
  settings,
  onSaveMitra,
  onSettleLogs,
  onBack,
}) => {
  const safeMitraList = Array.isArray(mitraList) ? mitraList : [];
  const safeLogKonsinyasi = Array.isArray(logKonsinyasi) ? logKonsinyasi : [];

  const [activeTab, setActiveTab] = useState<'rekap' | 'mitra'>('rekap');
  const [selectedMitraId, setSelectedMitraId] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM SETTLE' | 'SUDAH SETTLE'>('BELUM SETTLE');

  // Mitra modal state
  const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
  const [editingMitra, setEditingMitra] = useState<MitraKonsinyasi | null>(null);
  const [namaMitra, setNamaMitra] = useState('');
  const [kontak, setKontak] = useState('');
  const [rekening, setRekening] = useState('');
  const [skemaTipe, setSkemaTipe] = useState<'persen' | 'nominal'>('persen');
  const [skemaNilai, setSkemaNilai] = useState<number>(75);

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = new Date();

    return safeLogKonsinyasi.filter((log) => {
      if (selectedMitraId !== 'ALL' && log.id_mitra !== selectedMitraId) {
        return false;
      }

      if (statusFilter !== 'ALL' && log.status_settle !== statusFilter) {
        return false;
      }

      if (periodFilter !== 'ALL') {
        const logDate = new Date(log.tanggal);
        if (periodFilter === 'TODAY') {
          const todayStr = now.toISOString().split('T')[0];
          if (!log.tanggal || !log.tanggal.startsWith(todayStr)) return false;
        } else if (periodFilter === 'WEEK') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (logDate < sevenDaysAgo) return false;
        } else if (periodFilter === 'MONTH') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [safeLogKonsinyasi, selectedMitraId, statusFilter, periodFilter]);

  // Aggregate totals
  const totals = useMemo(() => {
    const totalQty = filteredLogs.reduce((sum, l) => sum + l.qty_terjual, 0);
    const totalGross = filteredLogs.reduce((sum, l) => sum + l.total_penjualan, 0);
    const totalMitra = filteredLogs.reduce((sum, l) => sum + l.bagian_mitra, 0);
    const totalWarkop = filteredLogs.reduce((sum, l) => sum + l.bagian_warkop, 0);

    const pendingLogIds = filteredLogs
      .filter((l) => l.status_settle === 'BELUM SETTLE')
      .map((l) => l.id);

    return { totalQty, totalGross, totalMitra, totalWarkop, pendingLogIds };
  }, [filteredLogs]);

  const handleOpenAddMitra = () => {
    setEditingMitra(null);
    setNamaMitra('');
    setKontak('');
    setRekening('');
    setSkemaTipe('persen');
    setSkemaNilai(75);
    setIsMitraModalOpen(true);
  };

  const handleOpenEditMitra = (m: MitraKonsinyasi) => {
    setEditingMitra(m);
    setNamaMitra(m.nama_mitra);
    setKontak(m.kontak);
    setRekening(m.rekening_bank || '');
    setSkemaTipe(m.skema_tipe);
    setSkemaNilai(m.skema_nilai);
    setIsMitraModalOpen(true);
  };

  const handleSaveMitraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMitra.trim()) return;

    const newMitra: MitraKonsinyasi = {
      id: editingMitra ? editingMitra.id : 'mitra-' + Date.now(),
      nama_mitra: namaMitra.trim(),
      kontak: kontak.trim(),
      produk_dititipkan: editingMitra ? editingMitra.produk_dititipkan : [],
      skema_bagi_hasil:
        skemaTipe === 'persen'
          ? `${skemaNilai}% Mitra / ${100 - skemaNilai}% Warkop`
          : `Rp ${Number(skemaNilai).toLocaleString('id-ID')} per item`,
      skema_tipe: skemaTipe,
      skema_nilai: Number(skemaNilai),
      status: 'aktif',
      rekening_bank: rekening.trim() || undefined,
    };

    onSaveMitra(newMitra);
    setIsMitraModalOpen(false);
  };

  const handleSettleAllPending = () => {
    if (totals.pendingLogIds.length === 0) return;
    if (
      confirm(
        `Tandai ${totals.pendingLogIds.length} item konsinyasi senilai ${formatCurrency(
          totals.totalMitra
        )} sudah dibayarkan/settle ke mitra?`
      )
    ) {
      onSettleLogs(totals.pendingLogIds);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 rounded-xl border-zinc-200 hover:bg-zinc-100 cursor-pointer shrink-0"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-700" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users2 className="w-5 h-5 text-primary" />
              Bagi Hasil & Konsinyasi Mitra
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manajemen penitip produk (gorengan, jajanan pasar) dan pembagian hasil otomatis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
            <Button
              variant={activeTab === 'rekap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('rekap')}
              className="text-xs h-8 px-3 rounded-md font-medium"
            >
              Rekap Penjualan
            </Button>
            <Button
              variant={activeTab === 'mitra' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('mitra')}
              className="text-xs h-8 px-3 rounded-md font-medium"
            >
              Daftar Mitra ({mitraList.length})
            </Button>
          </div>
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer sm:hidden"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'rekap' ? (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Porsi Terjual
                </span>
                <div className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                  {totals.totalQty} <span className="text-xs font-normal text-muted-foreground">Pcs</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Nilai Penjualan
                </span>
                <div className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                  {formatCurrency(totals.totalGross)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-amber-200/80 bg-amber-50/40">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  Bagian Mitra (Hutang Konsinyasi)
                </span>
                <div className="text-2xl font-bold tracking-tight mt-1 text-amber-900">
                  {formatCurrency(totals.totalMitra)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-emerald-200/80 bg-emerald-50/40">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider">
                  Margin Bersih Warkop
                </span>
                <div className="text-2xl font-bold tracking-tight mt-1 text-emerald-900">
                  {formatCurrency(totals.totalWarkop)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="shadow-sm">
            <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedMitraId}
                  onChange={(e) => setSelectedMitraId(e.target.value)}
                  className="h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">Semua Mitra</option>
                  {mitraList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_mitra}
                    </option>
                  ))}
                </select>

                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">Semua Periode</option>
                  <option value="TODAY">Hari Ini</option>
                  <option value="WEEK">7 Hari Terakhir</option>
                  <option value="MONTH">30 Hari Terakhir</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="BELUM SETTLE">Belum Settle (Pending)</option>
                  <option value="SUDAH SETTLE">Sudah Settle (Lunas)</option>
                </select>
              </div>

              {totals.pendingLogIds.length > 0 && (
                <Button
                  id="btn-settle-all"
                  size="sm"
                  onClick={handleSettleAllPending}
                  className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Settle {totals.pendingLogIds.length} Item ke Mitra</span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card className="shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Waktu</TableHead>
                  <TableHead>Mitra</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Total Jual</TableHead>
                  <TableHead className="text-right text-amber-900">Hak Mitra</TableHead>
                  <TableHead className="text-right text-emerald-900">Hak Warkop</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-28 text-center text-muted-foreground text-xs">
                      Tidak ada catatan transaksi konsinyasi pada filter ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(log.tanggal)}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {log.nama_mitra}
                      </TableCell>
                      <TableCell className="text-xs">{log.nama_produk}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {log.no_invoice}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs">
                        {log.qty_terjual}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(log.total_penjualan)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-amber-800">
                        {formatCurrency(log.bagian_mitra)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-emerald-700">
                        {formatCurrency(log.bagian_warkop)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={log.status_settle === 'SUDAH SETTLE' ? 'success' : 'warning'}
                          className="text-[10px] uppercase font-medium"
                        >
                          {log.status_settle}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status_settle === 'BELUM SETTLE' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSettleLogs([log.id])}
                            className="h-7 text-[11px] px-2.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            Settle
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                            <Check className="w-3 h-3" />
                            Selesai
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : (
        /* Mitra List Tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Daftar produsen & pemasok titipan yang aktif bekerja sama
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddMitra}
              className="gap-1.5 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Mitra Baru</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mitraList.map((m) => (
              <Card key={m.id} className="shadow-sm flex flex-col justify-between">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-foreground">
                      {m.nama_mitra}
                    </h4>
                    <Badge variant="success" className="text-[10px]">
                      Aktif
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{m.kontak || '-'}</span>
                    </div>
                    {m.rekening_bank && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-mono text-[11px]">{m.rekening_bank}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-muted/40 rounded-lg border text-xs">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase block">
                      Skema Bagi Hasil:
                    </span>
                    <p className="font-semibold text-primary mt-0.5">{m.skema_bagi_hasil}</p>
                  </div>
                </CardContent>

                <div className="px-4 py-2.5 border-t bg-muted/20 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditMitra(m)}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    Edit Data
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Mitra Modal */}
      <AnimatePresence>
        {isMitraModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border rounded-xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    {editingMitra ? 'Edit Mitra Konsinyasi' : 'Tambah Mitra Baru'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Konfigurasi kontak dan pembagian hasil penjualan
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMitraModalOpen(false)}
                  className="h-8 w-8 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSaveMitraSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Nama Mitra / Nama Usaha Titipan
                  </label>
                  <Input
                    type="text"
                    required
                    value={namaMitra}
                    onChange={(e) => setNamaMitra(e.target.value)}
                    placeholder="Contoh: Gorengan Mak Nur"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Nomor WhatsApp / Kontak
                  </label>
                  <Input
                    type="text"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Rekening Pembayaran / E-Wallet
                  </label>
                  <Input
                    type="text"
                    value={rekening}
                    onChange={(e) => setRekening(e.target.value)}
                    placeholder="BCA 1234567 a/n Nurhasanah"
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-foreground">
                      Tipe Bagi Hasil
                    </label>
                    <select
                      value={skemaTipe}
                      onChange={(e) => setSkemaTipe(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="persen">Persentase (%)</option>
                      <option value="nominal">Nominal / Porsi (Rp)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-foreground">
                      Nilai Hak Mitra ({skemaTipe === 'persen' ? '%' : 'Rp'})
                    </label>
                    <Input
                      type="number"
                      required
                      value={skemaNilai}
                      onChange={(e) => setSkemaNilai(Number(e.target.value))}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMitraModalOpen(false)}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs"
                  >
                    Simpan Mitra
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

