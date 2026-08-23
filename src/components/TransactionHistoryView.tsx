import React, { useState, useMemo } from 'react';
import { TransactionPOS, AppSettings, UserRole } from '../types';
import { formatCurrency, formatDate } from '../services/thermalPrint';
import { 
  Search, 
  Receipt, 
  Printer, 
  Clock, 
  Calendar,
  Check,
  Filter,
  ShieldCheck,
  UserCheck,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface TransactionHistoryViewProps {
  transactions?: TransactionPOS[];
  settings: AppSettings;
  userRole?: UserRole;
  onReprintReceipt: (transaction: TransactionPOS) => void;
  onUpdateTransactionStatus: (transactionId: string, newStatus: 'LUNAS' | 'BELUM BAYAR') => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions = [],
  settings,
  userRole = 'kasir',
  onReprintReceipt,
  onUpdateTransactionStatus,
  onDeleteTransaction,
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LUNAS' | 'BELUM BAYAR'>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'TUNAI' | 'QRIS'>('ALL');
  const [adminTimeFilter, setAdminTimeFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deletingTrx, setDeletingTrx] = useState<TransactionPOS | null>(null);

  const isAdmin = userRole === 'admin';
  const ITEMS_PER_PAGE = 10;

  // Filter logic
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Seven days ago timestamp
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Thirty days ago timestamp
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return safeTransactions.filter((t) => {
      if (!t.tanggal) return false;
      const tDate = new Date(t.tanggal);

      // Kasir constraint: Max 7 days
      if (!isAdmin) {
        if (tDate < sevenDaysAgo) return false;
      } else {
        // Admin filter
        if (adminTimeFilter === 'TODAY' && !t.tanggal.startsWith(todayStr)) return false;
        if (adminTimeFilter === '7DAYS' && tDate < sevenDaysAgo) return false;
        if (adminTimeFilter === '30DAYS' && tDate < thirtyDaysAgo) return false;
      }

      const matchSearch =
        (t.no_invoice || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.kasir || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.catatan && t.catatan.toLowerCase().includes(search.toLowerCase())) ||
        (t.items || []).some((i) => (i.nama || '').toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;
      const matchMethod =
        methodFilter === 'ALL'
          ? true
          : t.metode_bayar === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [safeTransactions, search, statusFilter, methodFilter, adminTimeFilter, isAdmin]);

  // Reset page when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [search, statusFilter, methodFilter, adminTimeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto">
      {/* Header & Filter Bar */}
      <Card className="p-5 shadow-xs border-zinc-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2 flex-wrap">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Riwayat Transaksi</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Real-Time</span>
              </span>
            </h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminTimeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  adminTimeFilter === 'ALL' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setAdminTimeFilter('TODAY')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  adminTimeFilter === 'TODAY' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setAdminTimeFilter('7DAYS')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  adminTimeFilter === '7DAYS' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setAdminTimeFilter('30DAYS')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  adminTimeFilter === '30DAYS' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                }`}
              >
                30 Hari
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari invoice, kasir, catatan, menu pesanan..."
              className="pl-9 text-xs h-9 rounded-xl border-zinc-200"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="LUNAS">Lunas</option>
              <option value="BELUM BAYAR">Kasbon (Belum Bayar)</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="h-9 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Metode</option>
              <option value="TUNAI">Tunai</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-2 shadow-xs border-zinc-200 bg-white">
          <Receipt className="w-10 h-10 text-zinc-300 mx-auto" />
          <p className="font-bold text-sm text-zinc-800">Tidak Ada Transaksi Ditemukan</p>
          <p className="text-xs text-zinc-500">Silakan sesuaikan filter pencarian Anda</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedTransactions.map((trx) => (
            <motion.div
              key={trx.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 shadow-xs border-zinc-200 bg-white hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {trx.no_invoice}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      • {formatDate(trx.tanggal)}
                    </span>
                    <Badge 
                      variant={trx.status === 'LUNAS' ? 'success' : 'warning'}
                      className="text-[10px] font-bold"
                    >
                      {trx.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {trx.metode_bayar === 'KASBON_BELUM_BAYAR' ? 'KASBON' : trx.metode_bayar}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-800 font-semibold">
                    {trx.items.map((it) => `${it.qty}x ${it.nama}`).join(', ')}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>Kasir: <strong className="text-zinc-800">{trx.kasir}</strong></span>
                    {trx.catatan && (
                      <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                        {trx.catatan}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Total & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t border-zinc-100 md:border-t-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">
                      Total
                    </span>
                    <span className="font-black text-base text-zinc-900">
                      {formatCurrency(trx.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {trx.status === 'BELUM BAYAR' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateTransactionStatus(trx.id, 'LUNAS')}
                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 gap-1 font-bold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pelunasan</span>
                      </Button>
                    )}

                    <Button
                      size="icon"
                      onClick={() => onReprintReceipt(trx)}
                      className="h-8 w-8 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
                      title="Cetak Struk"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>

                    {isAdmin && onDeleteTransaction && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingTrx(trx)}
                        className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Simple Pagination Control: Max 10 TRX per page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg cursor-pointer disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 min-w-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg cursor-pointer disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {deletingTrx && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Hapus Transaksi Ini?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus invoice <strong>{deletingTrx.no_invoice}</strong> senilai {formatCurrency(deletingTrx.total)}?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingTrx(null)}
                className="flex-1 text-xs font-bold rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (onDeleteTransaction && deletingTrx) {
                    onDeleteTransaction(deletingTrx.id);
                    setDeletingTrx(null);
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
