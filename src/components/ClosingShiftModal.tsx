import React, { useState, useMemo } from 'react';
import { TransactionPOS, AppSettings, User } from '../types';
import { formatCurrency, formatDate } from '../services/thermalPrint';
import { 
  Clock, 
  X, 
  Printer, 
  Banknote, 
  QrCode, 
  AlertCircle, 
  Send,
  Wallet,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ClosingShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: TransactionPOS[];
  currentUser: User | null;
  settings: AppSettings;
  onConfirmCloseShift?: (rekapData: {
    totalOmzet: number;
    totalTunai: number;
    totalQris: number;
    totalKasbon: number;
    uangFisikLaci: number;
    selisih: number;
    catatan?: string;
  }) => void;
}

export const ClosingShiftModal: React.FC<ClosingShiftModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  currentUser,
  settings,
  onConfirmCloseShift,
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const [uangFisikLaci, setUangFisikLaci] = useState<number>(0);
  const [catatanShift, setCatatanShift] = useState<string>('');

  // Filter today's transactions
  const todayTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return safeTransactions.filter((t) => t.tanggal && t.tanggal.startsWith(todayStr));
  }, [safeTransactions]);

  const summary = useMemo(() => {
    let totalOmzet = 0;
    let totalTunai = 0;
    let totalQris = 0;
    let totalKasbon = 0;

    todayTransactions.forEach((t) => {
      if (t.status === 'LUNAS') {
        totalOmzet += t.total;
        if (t.metode_bayar === 'TUNAI') {
          totalTunai += t.total;
        } else if (t.metode_bayar === 'QRIS') {
          totalQris += t.total;
        }
      } else if (t.status === 'BELUM BAYAR') {
        totalKasbon += t.total;
      }
    });

    const targetOmzetTunai = totalTunai;
    const selisih = uangFisikLaci ? uangFisikLaci - targetOmzetTunai : 0;

    return {
      count: todayTransactions.length,
      totalOmzet,
      totalTunai,
      totalQris,
      totalKasbon,
      targetOmzetTunai,
      selisih,
    };
  }, [todayTransactions, uangFisikLaci]);

  if (!isOpen) return null;

  const handlePrintShiftSummary = () => {
    window.print();
  };

  const handleKirimLaporanDanTutup = () => {
    const amountToTransfer = uangFisikLaci > 0 ? uangFisikLaci : summary.totalTunai;
    if (onConfirmCloseShift) {
      onConfirmCloseShift({
        totalOmzet: summary.totalOmzet,
        totalTunai: summary.totalTunai,
        totalQris: summary.totalQris,
        totalKasbon: summary.totalKasbon,
        uangFisikLaci: amountToTransfer,
        selisih: summary.selisih,
        catatan: catatanShift,
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-semibold text-base text-zinc-900 flex items-center gap-2">
                  <span>Tutup Shift & Absen Keluar</span>
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 font-semibold px-2 py-0.5 rounded-md border border-zinc-200">
                    Tanpa Foto
                  </span>
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Meta Info Banner */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Kasir Bertugas
                </span>
                <p className="font-bold text-xs text-zinc-900">{currentUser?.nama || 'BIMA'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Tanggal & Jam
                </span>
                <p className="font-bold text-xs text-amber-600 font-mono">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Financial Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Total Omzet Shift
                </span>
                <div className="text-lg font-black text-zinc-900 mt-0.5">
                  {formatCurrency(summary.totalOmzet)}
                </div>
                <span className="text-[10px] font-semibold text-zinc-500">
                  {summary.count} Transaksi
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  Pemasukan Tunai
                </span>
                <div className="text-lg font-black text-emerald-600 mt-0.5">
                  {formatCurrency(summary.totalTunai)}
                </div>
                <span className="text-[10px] font-medium text-emerald-700">Masuk Kas Warung</span>
              </div>

              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  Pemasukan QRIS
                </span>
                <div className="text-lg font-black text-blue-600 mt-0.5">
                  {formatCurrency(summary.totalQris)}
                </div>
                <span className="text-[10px] font-medium text-blue-700">Langsung rekening</span>
              </div>

              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Kasbon Belum Lunas
                </span>
                <div className="text-lg font-black text-amber-600 mt-0.5">
                  {formatCurrency(summary.totalKasbon)}
                </div>
                <span className="text-[10px] font-medium text-amber-700">Tagihan open tab</span>
              </div>
            </div>

            {/* Input Setoran Uang Fisik */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-600" />
                Input Setoran Uang Fisik Kasir
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Jumlah Uang Fisik / Setoran Dihitung (Rp):
                </label>
                <Input
                  type="number"
                  value={uangFisikLaci || ''}
                  onChange={(e) => setUangFisikLaci(Number(e.target.value))}
                  placeholder={`Contoh: ${summary.totalTunai || 0}`}
                  className="font-mono text-sm font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-zinc-500" />
                  Catatan untuk Admin / Owner (Opsional):
                </label>
                <Input
                  type="text"
                  value={catatanShift}
                  onChange={(e) => setCatatanShift(e.target.value)}
                  placeholder="Catatan tambahan shift kasir..."
                  className="text-xs bg-white"
                />
              </div>

              <div className="p-3 bg-white rounded-lg border border-zinc-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Target Omzet Tunai Sistem:</span>
                  <span className="font-bold text-zinc-900">{formatCurrency(summary.totalTunai)}</span>
                </div>
                {uangFisikLaci > 0 && (
                  <div className="flex justify-between font-bold pt-1 border-t border-zinc-100">
                    <span>Selisih Setoran:</span>
                    <span
                      className={
                        summary.selisih === 0
                          ? 'text-emerald-600'
                          : summary.selisih > 0
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }
                    >
                      {summary.selisih === 0
                        ? 'Cocok / Pas (Rp 0)'
                        : (summary.selisih > 0 ? '+' : '') + formatCurrency(summary.selisih)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                id="btn-print-shift-report"
                variant="outline"
                onClick={handlePrintShiftSummary}
                className="w-full text-xs font-bold gap-2 rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4 text-zinc-600" />
                <span>Cetak Rekap Shift (Thermal 58mm)</span>
              </Button>

              <Button
                id="btn-confirm-end-shift"
                onClick={handleKirimLaporanDanTutup}
                className="w-full text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Laporan ke Admin & Masuk Saldo Kas Warung</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
