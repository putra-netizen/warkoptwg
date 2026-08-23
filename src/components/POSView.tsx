import React, { useState, useMemo } from 'react';
import { 
  Product, 
  CartItem, 
  PaymentMethod, 
  TransactionPOS, 
  AppSettings, 
  User, 
  ProductCategory 
} from '../types';
import { formatCurrency } from '../services/thermalPrint';
import { LocalStorageService } from '../services/storage';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Banknote, 
  QrCode, 
  Clock, 
  Coffee, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  Flame, 
  AlertCircle,
  RotateCcw,
  UserCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

interface POSViewProps {
  products?: Product[];
  currentUser: User;
  settings: AppSettings;
  onCheckoutComplete?: (transaction: TransactionPOS) => void;
  onCheckout?: (transaction: TransactionPOS) => void;
  cart?: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpenClosingModal?: () => void;
}

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'ALL', label: 'Semua Menu', icon: '🍽️' },
  { id: 'Kopi & Teh', label: 'Kopi & Teh', icon: '☕' },
  { id: 'Minuman Dingin', label: 'Minuman Dingin', icon: '🥤' },
  { id: 'Indomie & Mie', label: 'Indomie & Mie', icon: '🍜' },
  { id: 'Makanan & Toast', label: 'Roti & Makanan', icon: '🍞' },
  { id: 'Snack & Gorengan', label: 'Camilan', icon: '🍘' },
  { id: 'Konsinyasi', label: 'Titipan Mitra', icon: '🤝' },
];

export const POSView: React.FC<POSViewProps> = ({
  products = [],
  currentUser,
  settings,
  onCheckoutComplete,
  onCheckout,
  cart = [],
  setCart,
  onOpenClosingModal,
}) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCart = Array.isArray(cart) ? cart : [];

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNote, setTableNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [recentCustomers, setRecentCustomers] = useState<string[]>(() => {
    return LocalStorageService.getRecentCustomers();
  });
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return safeProducts.filter((p) => {
      const matchCategory =
        selectedCategory === 'ALL'
          ? true
          : selectedCategory === 'Konsinyasi'
          ? p.is_konsinyasi
          : p.kategori === selectedCategory;

      const matchSearch =
        (p.nama_produk || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.kategori || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [safeProducts, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return safeCart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [safeCart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod === 'TUNAI') {
      return Math.max(0, paidAmount - totalAmount);
    }
    return 0;
  }, [paymentMethod, paidAmount, totalAmount]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stok <= 0) return;

    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) return prev; // Limit to available stock
        return prev.map((it) =>
          it.product.id === product.id
            ? { ...it, qty: it.qty + 1, subtotal: (it.qty + 1) * it.product.harga_jual }
            : it
        );
      } else {
        return [
          ...prev,
          {
            product,
            qty: 1,
            subtotal: product.harga_jual,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.qty + delta;
            if (nextQty <= 0) return null;
            if (nextQty > it.product.stok) return it;
            return { ...it, qty: nextQty, subtotal: nextQty * it.product.harga_jual };
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setTableNote('');
    setCustomerName('');
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidAmount(totalAmount); // Default exact amount
    // Refresh recent customer list from storage
    setRecentCustomers(LocalStorageService.getRecentCustomers());
    setIsCheckoutOpen(true);
  };

  // Process Checkout
  const handleProcessCheckout = () => {
    if (cart.length === 0) return;

    // Save recent customer name if filled
    if (customerName.trim()) {
      const updatedList = LocalStorageService.addRecentCustomer(customerName.trim());
      setRecentCustomers(updatedList);
    }

    const fullCatatan = [
      customerName.trim() ? `Pelanggan: ${customerName.trim()}` : '',
      tableNote.trim() ? `Ket: ${tableNote.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ') || undefined;

    const invoiceNumber = `TWG-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newTransaction: TransactionPOS = {
      id: 'trx-' + Date.now(),
      no_invoice: invoiceNumber,
      tanggal: new Date().toISOString(),
      kasir: currentUser.nama || 'Kasir Warkop',
      items: cart.map((it) => ({
        produk_id: it.product.id,
        nama: it.product.nama_produk,
        qty: it.qty,
        harga: it.product.harga_jual,
        subtotal: it.subtotal,
        is_konsinyasi: it.product.is_konsinyasi,
        id_mitra: it.product.id_mitra,
      })),
      subtotal,
      diskon: discountAmount,
      total: totalAmount,
      metode_bayar: paymentMethod,
      bayar: paymentMethod === 'KASBON_BELUM_BAYAR' ? 0 : paidAmount,
      kembali: paymentMethod === 'KASBON_BELUM_BAYAR' ? 0 : changeAmount,
      status: paymentMethod === 'KASBON_BELUM_BAYAR' ? 'BELUM BAYAR' : 'LUNAS',
      catatan: fullCatatan,
    };

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#18181b', '#71717a', '#a1a1aa'],
      });
    } catch {
      // Ignore confetti error if unavailable
    }

    setIsCheckoutOpen(false);
    setIsMobileCartOpen(false);
    handleClearCart();
    if (onCheckoutComplete) {
      onCheckoutComplete(newTransaction);
    } else if (onCheckout) {
      onCheckout(newTransaction);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20 max-w-7xl mx-auto">
      {/* Left Area: Products Grid & Search */}
      <div className="flex-1 space-y-4">
        {/* Top Filter Bar: Search + Category Chips */}
        <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                id="input-search-product"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kopi, indomie, gorengan, rokok..."
                className="pl-9 pr-8 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-0.5 rounded-md hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                id="btn-tutup-kasir-header"
                variant="outline"
                size="sm"
                onClick={onOpenClosingModal}
                className="gap-1.5 text-xs font-medium"
                title="Rekap shift dan tutup kasir"
              >
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Tutup Kasir</span>
              </Button>

              {/* Mobile cart toggle button */}
              <Button
                id="btn-toggle-mobile-cart"
                size="sm"
                onClick={() => setIsMobileCartOpen(true)}
                className="lg:hidden gap-1.5 text-xs font-medium"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Keranjang ({cart.reduce((a, b) => a + b.qty, 0)})</span>
              </Button>
            </div>
          </div>

          {/* Category Chips Scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  id={`cat-chip-${cat.id}`}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="h-8 text-xs font-medium rounded-lg gap-1.5 shrink-0"
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-card border rounded-xl p-12 text-center space-y-2">
            <Coffee className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-base text-foreground">
              Menu Tidak Ditemukan
            </h3>
            <p className="text-xs text-muted-foreground">
              Coba kata kunci lain atau pilih kategori Semua Menu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stok <= 0;
              const isLowStock = product.stok > 0 && product.stok <= 5;
              const inCartItem = cart.find((it) => it.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border bg-card shadow-sm transition-all select-none cursor-pointer group ${
                    isOutOfStock
                      ? 'opacity-50 bg-muted/30 cursor-not-allowed'
                      : 'hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex justify-between items-start gap-1 mb-3">
                    <span className="text-2xl bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center w-11 h-11 leading-none select-none shrink-0 overflow-hidden shadow-2xs">
                      {product.gambar || '☕'}
                    </span>

                    <div className="flex flex-col items-end gap-1">
                      {product.is_konsinyasi && (
                        <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                          Titipan
                        </Badge>
                      )}

                      {isOutOfStock ? (
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                          Habis
                        </Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                          Sisa {product.stok}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Stok {product.stok}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                      {product.nama_produk}
                    </h4>
                    <span className="text-[10px] text-muted-foreground block">
                      {product.satuan || 'Porsi'}
                    </span>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="font-semibold text-xs text-foreground">
                      {formatCurrency(product.harga_jual)}
                    </span>

                    {inCartItem ? (
                      <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-[10px]">
                        {inCartItem.qty}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        disabled={isOutOfStock}
                        className="h-6 w-6 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Area: Order Cart Sidebar (Desktop Docked) */}
      <div className="hidden lg:block w-96 shrink-0">
        <Card className="sticky top-4 shadow-sm overflow-hidden flex flex-col max-h-[85vh]">
          {/* Cart Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-foreground" />
              <span className="font-semibold text-sm text-foreground">
                Keranjang Pesanan
              </span>
            </div>
            {cart.length > 0 && (
              <Button
                id="btn-clear-cart"
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Kosongkan</span>
              </Button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[42vh]">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto stroke-1 text-muted-foreground/60" />
                <p className="text-xs font-medium">Keranjang masih kosong</p>
                <p className="text-[11px] text-muted-foreground/80">Pilih menu dari katalog untuk memesan</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20"
                >
                  <div className="flex-1 pr-2">
                    <h5 className="font-medium text-xs text-foreground leading-tight">
                      {item.product.nama_produk}
                    </h5>
                    <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                      {formatCurrency(item.product.harga_jual)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateQty(item.product.id, -1)}
                      className="h-6 w-6 rounded-md"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>

                    <span className="w-6 text-center font-mono text-xs font-semibold">
                      {item.qty}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateQty(item.product.id, 1)}
                      className="h-6 w-6 rounded-md"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer: Discount, Table Note & Total */}
          {cart.length > 0 && (
            <div className="p-4 bg-muted/40 border-t space-y-3">
              {/* Note / Table input */}
              <Input
                id="input-table-note"
                type="text"
                value={tableNote}
                onChange={(e) => setTableNote(e.target.value)}
                placeholder="Nomor Meja / Catatan Pesanan..."
                className="text-xs h-8 bg-background"
              />

              {/* Discount Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Diskon:
                </span>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((pct) => (
                    <Button
                      key={pct}
                      variant={discountPercent === pct ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiscountPercent(pct)}
                      className="h-6 px-2 text-[10px] rounded"
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs pt-2 border-t">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Diskon ({discountPercent}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-foreground pt-1 border-t">
                  <span>Total Tagihan</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                id="btn-open-checkout-desktop"
                size="lg"
                onClick={handleOpenCheckout}
                className="w-full text-xs font-semibold gap-2"
              >
                <span>Bayar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile Floating Cart Summary Bar (Above bottom nav) */}
      {cart.length > 0 && (
        <div className="fixed bottom-18 inset-x-0 z-35 flex justify-center px-4 lg:hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto w-full max-w-md bg-zinc-950 border border-zinc-800 text-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-between"
          >
            <div 
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 pl-2 cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-zinc-400 font-medium">
                  {cart.reduce((a, b) => a + b.qty, 0)} Item Terpilih
                </span>
                <span className="font-extrabold text-sm text-white font-mono">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            <Button
              id="btn-mobile-quick-pay"
              size="sm"
              onClick={handleOpenCheckout}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md gap-1.5"
            >
              <span>Bayar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        </div>
      )}

      {/* Mobile Cart Drawer Overlay */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/75">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="bg-white border-t rounded-t-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-zinc-900" />
                  <span className="font-bold text-sm text-zinc-900">
                    Keranjang Pesanan ({cart.reduce((a, b) => a + b.qty, 0)} item)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="h-8 w-8 text-zinc-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* List */}
              <div className="py-3 overflow-y-auto flex-1 space-y-2">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-xs text-zinc-400">
                    Keranjang kosong
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50"
                    >
                      <div className="flex-1 pr-2">
                        <h6 className="font-bold text-xs text-zinc-900">{item.product.nama_produk}</h6>
                        <span className="text-xs text-zinc-600 font-semibold font-mono">
                          {formatCurrency(item.product.harga_jual)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="h-8 w-8 rounded-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="font-mono font-bold text-xs w-6 text-center">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="h-8 w-8 rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary & Pay */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-zinc-200 space-y-3">
                  <Input
                    type="text"
                    value={tableNote}
                    onChange={(e) => setTableNote(e.target.value)}
                    placeholder="No Meja / Catatan Pesanan..."
                    className="text-xs h-10"
                  />
                  <div className="flex justify-between items-center font-extrabold text-sm">
                    <span className="text-zinc-600">Total Pembayaran:</span>
                    <span className="text-lg text-zinc-900 font-mono">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => {
                      setIsMobileCartOpen(false);
                      handleOpenCheckout();
                    }}
                    className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl"
                  >
                    Lanjut ke Pembayaran
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout & Payment Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-base text-foreground">
                    Proses Pembayaran
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
                {/* Total Display Banner */}
                <div className="bg-muted/40 p-4 rounded-xl border text-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    Total Tagihan Pesanan
                  </span>
                  <div className="text-3xl font-bold tracking-tight text-foreground mt-1">
                    {formatCurrency(totalAmount)}
                  </div>
                  {tableNote && (
                    <Badge variant="outline" className="text-xs font-normal mt-2">
                      Catatan: {tableNote}
                    </Badge>
                  )}
                </div>

                {/* Nama Pembeli Input (Wajib Default Kosong & Auto Suggestions) */}
                <div className="space-y-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Nama Pembeli / Pelanggan:</span>
                    </label>
                    <span className="text-[10px] font-semibold text-zinc-400">
                      (Wajib kosong saat baru)
                    </span>
                  </div>

                  <div className="relative">
                    <Input
                      id="input-customer-name-checkout"
                      type="text"
                      list="recent-customers-datalist"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ketik nama pembeli / pelanggan langganan..."
                      className="text-xs bg-white h-9.5 pr-8 border-zinc-300 focus:border-zinc-900 rounded-lg"
                    />
                    {customerName && (
                      <button
                        type="button"
                        onClick={() => setCustomerName('')}
                        className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* HTML Datalist for autocomplete */}
                  <datalist id="recent-customers-datalist">
                    {recentCustomers.map((cust, idx) => (
                      <option key={idx} value={cust} />
                    ))}
                  </datalist>

                  {/* Clickable Quick Suggestion Chips */}
                  {recentCustomers.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Saran Pelanggan Langganan (1-Tap):
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {recentCustomers.length} nama tersimpan
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                        {recentCustomers.slice(0, 10).map((name, idx) => {
                          const isSelected = customerName.toLowerCase() === name.toLowerCase();
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCustomerName(name)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100/80 active:scale-95'
                              }`}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">
                    Pilih Metode Pembayaran:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      id="btn-method-tunai"
                      type="button"
                      variant={paymentMethod === 'TUNAI' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('TUNAI')}
                      className="flex flex-col h-auto py-3 gap-1 rounded-xl"
                    >
                      <Banknote className="w-4 h-4" />
                      <span className="text-xs font-medium">TUNAI</span>
                    </Button>

                    <Button
                      id="btn-method-qris"
                      type="button"
                      variant={paymentMethod === 'QRIS' ? 'default' : 'outline'}
                      onClick={() => {
                        setPaymentMethod('QRIS');
                        setPaidAmount(totalAmount);
                      }}
                      className="flex flex-col h-auto py-3 gap-1 rounded-xl"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-xs font-medium">QRIS</span>
                    </Button>

                    <Button
                      id="btn-method-kasbon"
                      type="button"
                      variant={paymentMethod === 'KASBON_BELUM_BAYAR' ? 'default' : 'outline'}
                      onClick={() => {
                        setPaymentMethod('KASBON_BELUM_BAYAR');
                        setPaidAmount(0);
                      }}
                      className="flex flex-col h-auto py-3 gap-1 rounded-xl"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">KASBON</span>
                    </Button>
                  </div>
                </div>

                {/* Specific Method UI */}
                {paymentMethod === 'TUNAI' && (
                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">
                        Nominal Uang Tunai Diterima (Rp):
                      </label>
                      <Input
                        id="input-cash-amount"
                        type="number"
                        value={paidAmount || ''}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="font-mono text-base font-semibold"
                      />
                    </div>

                    {/* Quick Cash Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Nominal Cepat:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setPaidAmount(totalAmount)}
                          className="text-xs font-medium h-7"
                        >
                          Uang Pas
                        </Button>
                        {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                          <Button
                            key={amt}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaidAmount(amt)}
                            className="text-xs font-medium h-7"
                          >
                            {formatCurrency(amt)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Change Display */}
                    <div className="p-3 bg-background rounded-lg border flex justify-between items-center">
                      <span className="text-xs font-medium text-foreground">Kembalian:</span>
                      <span
                        className={`font-semibold text-base font-mono ${
                          paidAmount >= totalAmount ? 'text-emerald-600' : 'text-destructive'
                        }`}
                      >
                        {paidAmount >= totalAmount
                          ? formatCurrency(changeAmount)
                          : 'Uang Kurang!'}
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'QRIS' && (
                  <div className="bg-muted/30 p-5 rounded-xl border text-center space-y-3">
                    <div className="w-36 h-36 bg-background p-2 mx-auto rounded-lg border flex items-center justify-center shadow-sm">
                      <QrCode className="w-28 h-28 text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs text-foreground">
                        QRIS {settings.nama_warkop} (NMID: ID1029384756)
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Scan via BCA, Mandiri, GoPay, OVO, ShopeePay, DANA
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'KASBON_BELUM_BAYAR' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-medium text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span>Catatan Kasbon / Open Tab</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Pesanan akan disimpan dengan status <strong>"BELUM BAYAR"</strong>. Pastikan mencatat nama pelanggan atau nomor meja di kolom catatan.
                    </p>
                  </div>
                )}

                {/* Final Submit Button */}
                <Button
                  id="btn-confirm-checkout"
                  size="lg"
                  disabled={paymentMethod === 'TUNAI' && paidAmount < totalAmount}
                  onClick={handleProcessCheckout}
                  className="w-full text-xs font-semibold gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan & Cetak Struk</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

