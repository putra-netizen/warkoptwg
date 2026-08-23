import React, { useRef } from 'react';
import { TransactionPOS, AppSettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { 
  formatCurrency, 
  formatDate, 
  generateRawBTUrl 
} from '../services/thermalPrint';
import { Printer, Check, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface ReceiptModalProps {
  transaction: TransactionPOS | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleRawBTPrint = () => {
    const rawBtUrl = generateRawBTUrl(transaction, settings);
    window.location.href = rawBtUrl;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col"
        >
          {/* Top Bar Dialog */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="font-semibold text-xs text-zinc-200 tracking-wide uppercase">
                Pratinjau Struk 58mm
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Scroll Area */}
          <div className="p-4 overflow-y-auto max-h-[70vh] flex flex-col items-center bg-zinc-950/60">
            {/* Real Thermal Paper Simulation Container */}
            <div
              id="thermal-receipt-area"
              ref={receiptRef}
              className="w-full bg-[#FAFAF7] text-zinc-900 p-4 sm:p-5 shadow-lg border-t-4 border-b-4 border-zinc-400/40 relative font-mono text-[11px] leading-tight select-none rounded-xs"
              style={{
                fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
              }}
            >
              {/* Paper Zigzag Top visual decoration */}
              <div className="text-center font-bold tracking-widest text-[9px] text-zinc-400 select-none pb-2 border-b border-dashed border-zinc-400">
                - - - - - - - - - - - - - - - - - - - -
              </div>

              {/* Monochrome Logo & Warkop Header */}
              <div className="flex flex-col items-center justify-center text-center py-2.5">
                <BrandLogo size="receipt" showSubtitle={false} monochrome={true} className="justify-center mb-1" />
                <div className="font-extrabold text-xs tracking-wider text-black uppercase mt-1">
                  {settings.store_name}
                </div>
                <div className="text-[10px] text-zinc-700">
                  {settings.store_tagline}
                </div>
                <div className="text-[9px] text-zinc-600">
                  {settings.store_address}
                </div>
                <div className="text-[9px] text-zinc-600">
                  Telp: {settings.store_phone}
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2" />

              {/* Meta Info */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600">NO INV :</span>
                  <span className="font-bold">{transaction.no_invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">TANGGAL:</span>
                  <span>{formatDate(transaction.tanggal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">KASIR  :</span>
                  <span>{transaction.kasir}</span>
                </div>
                {transaction.catatan && (
                  <div className="flex justify-between font-bold">
                    <span className="text-zinc-600">MEJA/CAT:</span>
                    <span>{transaction.catatan}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2" />

              {/* Itemized list */}
              <div className="space-y-1.5 py-0.5">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between font-bold text-black">
                      <span className="truncate pr-1">{item.nama}</span>
                      <span className="shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                    <div className="text-[9px] text-zinc-600 flex items-center justify-between">
                      <span>{item.qty} x {formatCurrency(item.harga)}</span>
                      {item.is_konsinyasi && <span>[TITIPAN]</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2" />

              {/* Totals */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(transaction.subtotal)}</span>
                </div>
                {transaction.diskon > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Diskon:</span>
                    <span>-{formatCurrency(transaction.diskon)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xs text-black pt-1 border-t border-zinc-400">
                  <span>TOTAL AKHIR:</span>
                  <span>{formatCurrency(transaction.total)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2" />

              {/* Payment Details */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Metode :</span>
                  <span className="font-bold uppercase">
                    {transaction.metode_bayar === 'KASBON_BELUM_BAYAR' ? 'KASBON' : transaction.metode_bayar}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar  :</span>
                  <span>{formatCurrency(transaction.bayar)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembali:</span>
                  <span>{formatCurrency(transaction.kembali)}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Status :</span>
                  <span className="font-bold underline">{transaction.status}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2.5" />

              {/* Thermal Footer */}
              <div className="text-center space-y-0.5 text-[9px] text-zinc-700 py-1">
                <div className="font-bold uppercase text-black">
                  MATUR NUWUN / TERIMA KASIH
                </div>
                <div>Simpan struk ini sebagai bukti sah</div>
                <div>IG: {settings.store_ig}</div>
              </div>

              <div className="text-center font-bold tracking-widest text-[9px] text-zinc-400 select-none pt-2 border-t border-dashed border-zinc-400">
                - - - - - - - - - - - - - - - - - - - -
              </div>
            </div>
          </div>

          {/* Minimal 2 Bottom Action Buttons as explicitly requested */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 grid grid-cols-2 gap-2">
            <Button
              id="btn-print-receipt"
              onClick={handleBrowserPrint}
              className="h-10 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs gap-2 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </Button>

            <Button
              id="btn-close-receipt"
              variant="outline"
              onClick={onClose}
              className="h-10 border-zinc-700 text-zinc-200 hover:bg-zinc-800 font-bold text-xs gap-2 rounded-xl"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Selesai</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
