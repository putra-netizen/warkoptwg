import React, { useState, useMemo, useEffect } from 'react';
import { Product, MitraKonsinyasi, ProductCategory, AppSettings } from '../types';
import { formatCurrency } from '../services/thermalPrint';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users2, 
  Check, 
  X,
  Sparkles,
  Tag,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface ProductManagementProps {
  products?: Product[];
  mitraList?: MitraKonsinyasi[];
  settings?: AppSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const CATEGORY_OPTIONS: ProductCategory[] = [
  'Kopi & Teh',
  'Minuman Dingin',
  'Indomie & Mie',
  'Makanan & Toast',
  'Snack & Gorengan',
  'Konsinyasi',
  'Lainnya',
];

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products = [],
  mitraList = [],
  settings,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeMitraList = Array.isArray(mitraList) ? mitraList : [];

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirmation Modal State
  const [deletingProductId, setDeletingProductId] = useState<Product | null>(null);

  // Toast Notification State (2 seconds auto-hide)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState<ProductCategory>('Kopi & Teh');
  const [hargaBeliStr, setHargaBeliStr] = useState<string>('');
  const [hargaJualStr, setHargaJualStr] = useState<string>('');
  const [stokStr, setStokStr] = useState<string>('');
  const [satuan, setSatuan] = useState('Gelas');
  const [isKonsinyasi, setIsKonsinyasi] = useState(false);
  const [idMitra, setIdMitra] = useState('');
  const [skemaTipe, setSkemaTipe] = useState<'persen' | 'nominal'>('persen');
  const [skemaNilai, setSkemaNilai] = useState<number>(75);
  const [gambar, setGambar] = useState('☕');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2000);
  };

  const filtered = useMemo(() => {
    return safeProducts.filter((p) => {
      const matchSearch =
        (p.nama_produk || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.kategori || '').toLowerCase().includes(search.toLowerCase());

      const matchCat =
        categoryFilter === 'ALL'
          ? true
          : categoryFilter === 'Konsinyasi'
          ? p.is_konsinyasi
          : p.kategori === categoryFilter;

      return matchSearch && matchCat;
    });
  }, [safeProducts, search, categoryFilter]);

  // Smart Auto-detection when typing product name
  const handleNamaProdukChange = (val: string) => {
    setNamaProduk(val);
    const lower = val.toLowerCase().trim();

    if (
      lower.includes('kopi') ||
      lower.includes('espresso') ||
      lower.includes('latte') ||
      lower.includes('tubruk') ||
      lower.includes('cappuccino') ||
      lower.includes('americano') ||
      lower.includes('luwak') ||
      lower.includes('v60') ||
      lower.includes('sanger')
    ) {
      setGambar('☕');
      setSatuan('Gelas');
      if (!isKonsinyasi) setKategori('Kopi & Teh');
    } else if (
      lower.includes('teh') ||
      lower.includes('tea') ||
      lower.includes('matcha') ||
      lower.includes('tarik')
    ) {
      setGambar('🍵');
      setSatuan('Gelas');
      if (!isKonsinyasi) setKategori('Kopi & Teh');
    } else if (
      lower.includes('es') ||
      lower.includes('jus') ||
      lower.includes('juice') ||
      lower.includes('soda') ||
      lower.includes('sirup') ||
      lower.includes('dingin') ||
      lower.includes('boba') ||
      lower.includes('lemon') ||
      lower.includes('jeruk') ||
      lower.includes('susu') ||
      lower.includes('squash') ||
      lower.includes('yakult') ||
      lower.includes('josu') ||
      lower.includes('kusu') ||
      lower.includes('nutrisari')
    ) {
      setGambar('🧃');
      setSatuan('Gelas');
      if (!isKonsinyasi) setKategori('Minuman Dingin');
    } else if (
      lower.includes('mie') ||
      lower.includes('indomie') ||
      lower.includes('ramen') ||
      lower.includes('noodle') ||
      lower.includes('bihun') ||
      lower.includes('kwetiau') ||
      lower.includes('samyang') ||
      lower.includes('magelangan')
    ) {
      setGambar('🍜');
      setSatuan('Porsi');
      if (!isKonsinyasi) setKategori('Indomie & Mie');
    } else if (
      lower.includes('roti') ||
      lower.includes('toast') ||
      lower.includes('bakar') ||
      lower.includes('sandwich') ||
      lower.includes('pancong')
    ) {
      setGambar('🍞');
      setSatuan('Porsi');
      if (!isKonsinyasi) setKategori('Makanan & Toast');
    } else if (
      lower.includes('gorengan') ||
      lower.includes('pisang') ||
      lower.includes('tahu') ||
      lower.includes('tempe') ||
      lower.includes('bakwan') ||
      lower.includes('cireng') ||
      lower.includes('risol') ||
      lower.includes('pastel') ||
      lower.includes('dimsum') ||
      lower.includes('mendoan')
    ) {
      setGambar('🥟');
      setSatuan('Pcs');
      if (!isKonsinyasi) setKategori('Snack & Gorengan');
    } else if (
      lower.includes('nasi') ||
      lower.includes('rice') ||
      lower.includes('ayam') ||
      lower.includes('bebek') ||
      lower.includes('soto') ||
      lower.includes('pecel')
    ) {
      setGambar('🍛');
      setSatuan('Porsi');
      if (!isKonsinyasi) setKategori('Makanan & Toast');
    } else if (
      lower.includes('snack') ||
      lower.includes('keripik') ||
      lower.includes('krupuk') ||
      lower.includes('chiki') ||
      lower.includes('kacang') ||
      lower.includes('popcorn')
    ) {
      setGambar('🍿');
      setSatuan('Bungkus');
      if (!isKonsinyasi) setKategori('Snack & Gorengan');
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNamaProduk('');
    setKategori('Kopi & Teh');
    setHargaBeliStr('');
    setHargaJualStr('');
    setStokStr('');
    setSatuan('Gelas');
    setIsKonsinyasi(false);
    setIdMitra(safeMitraList[0]?.id || '');
    setSkemaTipe('persen');
    setSkemaNilai(75);
    setGambar('☕');
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setNamaProduk(prod.nama_produk);
    setKategori(prod.kategori as ProductCategory);
    setHargaBeliStr(prod.harga_beli ? String(prod.harga_beli) : '');
    setHargaJualStr(prod.harga_jual ? String(prod.harga_jual) : '');
    setStokStr(prod.stok !== undefined ? String(prod.stok) : '');
    setSatuan(prod.satuan || 'Porsi');
    setIsKonsinyasi(!!prod.is_konsinyasi);
    setIdMitra(prod.id_mitra || safeMitraList[0]?.id || '');
    setSkemaTipe(prod.skema_mitra_tipe || 'persen');
    setSkemaNilai(prod.skema_mitra_nilai || 75);
    setGambar(prod.gambar || '☕');
    setIsSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProduk.trim()) return;

    const cleanHargaBeli = Number(hargaBeliStr.replace(/\D/g, '')) || 0;
    const cleanHargaJual = Number(hargaJualStr.replace(/\D/g, '')) || 0;
    const cleanStok = Number(stokStr.replace(/\D/g, '')) || 0;

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      nama_produk: namaProduk.trim(),
      kategori: isKonsinyasi ? 'Konsinyasi' : kategori,
      harga_beli: cleanHargaBeli,
      harga_jual: cleanHargaJual,
      stok: cleanStok,
      satuan: satuan.trim() || 'Porsi',
      is_konsinyasi: isKonsinyasi,
      id_mitra: isKonsinyasi ? idMitra : undefined,
      skema_mitra_tipe: isKonsinyasi ? skemaTipe : undefined,
      skema_mitra_nilai: isKonsinyasi ? Number(skemaNilai) : undefined,
      gambar: gambar.trim() || '☕',
    };

    onSaveProduct(newProd);
    setIsSheetOpen(false);
    triggerToast(
      editingProduct
        ? `${newProd.nama_produk} berhasil diperbarui!`
        : `${newProd.nama_produk} berhasil ditambahkan!`
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingProductId) return;
    const prodName = deletingProductId.nama_produk;
    onDeleteProduct(deletingProductId.id);
    setDeletingProductId(null);
    triggerToast(`${prodName} berhasil dihapus!`);
  };

  return (
    <div className="space-y-5 pb-20 max-w-7xl mx-auto font-sans relative">
      {/* Top Toast Notification (Bottom-Left 2s Animation) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-zinc-700 flex items-center gap-2.5 text-xs font-bold pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>Katalog Menu & Stok Produk</span>
          </h2>
        </div>

        <Button
          id="btn-add-new-product"
          onClick={handleOpenAdd}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs gap-1.5 h-10 px-4 rounded-xl cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Category Scrollable Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Semua ({safeProducts.length})
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = safeProducts.filter((p) =>
              cat === 'Konsinyasi' ? p.is_konsinyasi : p.kategori === cat
            ).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu atau kategori..."
            className="pl-9 h-10 text-xs rounded-xl border-zinc-200"
          />
        </div>
      </div>

      {/* Card-Based Layout (Fit for both Mobile and Laptop, no table overflow) */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-2 shadow-xs border-zinc-200 bg-white">
          <Package className="w-10 h-10 text-zinc-300 mx-auto" />
          <p className="font-bold text-sm text-zinc-800">Tidak Ada Menu Ditemukan</p>
          <p className="text-xs text-zinc-500">Coba kata kunci pencarian atau kategori lain</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((prod) => {
            const margin = (prod.harga_jual || 0) - (prod.harga_beli || 0);
            const isLowStock = prod.stok <= 5;

            return (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between space-y-3 relative group"
              >
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xl shrink-0">
                        {prod.gambar || '☕'}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">
                          {prod.nama_produk}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                            {prod.kategori}
                          </span>
                          {prod.is_konsinyasi && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Konsinyasi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                        isLowStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {prod.stok} {prod.satuan || 'Pcs'}
                    </span>
                  </div>
                </div>

                {/* Price & Margin Breakdown */}
                <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-medium">Harga Jual:</span>
                    <span className="font-black text-sm text-zinc-900">
                      {formatCurrency(prod.harga_jual)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>HPP (Harga Beli):</span>
                    <span>{formatCurrency(prod.harga_beli)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 text-[11px]">
                    <span className="font-bold text-emerald-700">Margin Laba:</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(margin)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(prod)}
                    className="h-8 px-3 text-xs font-bold text-zinc-700 border-zinc-200 hover:bg-zinc-100 rounded-xl gap-1 cursor-pointer flex-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingProductId(prod)}
                    className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer shrink-0"
                    title="Hapus Menu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Hapus Menu Ini?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{deletingProductId.nama_produk}</strong> dari daftar katalog?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingProductId(null)}
                className="flex-1 text-xs font-bold rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Sheet / Drawer for Add & Edit Product */}
      <AnimatePresence>
        {isSheetOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="fixed inset-0 bg-black/50 transition-opacity"
            />

            {/* Slide-Over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md bg-white border-l border-zinc-200 h-full shadow-2xl z-10 flex flex-col justify-between font-sans overflow-y-auto"
            >
              {/* Sheet Header */}
              <div className="p-5 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      {editingProduct ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Auto-detect ikon & satuan porsi secara otomatis
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
                {/* Nama Produk with Smart Auto-detection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Nama Menu / Produk:</label>
                  <Input
                    type="text"
                    value={namaProduk}
                    onChange={(e) => handleNamaProdukChange(e.target.value)}
                    placeholder="Ketik nama menu, misal: Kopi Tubruk, Indomie Goreng..."
                    className="h-10 text-xs rounded-xl font-semibold"
                    required
                    autoFocus
                  />
                  <span className="text-[10px] text-zinc-400 block">
                    *Ikon & satuan otomatis menyesuaikan jenis makanan/minuman yang diketik
                  </span>
                </div>

                {/* Kategori Tab Button Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Kategori Menu:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setKategori(cat);
                          if (cat === 'Konsinyasi') setIsKonsinyasi(true);
                          else setIsKonsinyasi(false);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer border ${
                          kategori === cat
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Harga Beli (Rupiah Formatted) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Harga Beli / HPP (Rupiah):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">
                      Rp
                    </span>
                    <Input
                      type="text"
                      value={
                        hargaBeliStr
                          ? Number(hargaBeliStr.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => setHargaBeliStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="pl-10 h-10 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Harga Jual (Rupiah Formatted) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Harga Jual ke Pelanggan (Rupiah):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">
                      Rp
                    </span>
                    <Input
                      type="text"
                      value={
                        hargaJualStr
                          ? Number(hargaJualStr.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => setHargaJualStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="pl-10 h-10 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Margin Preview Box */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-800">Keuntungan per Porsi:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(
                      (Number(hargaJualStr.replace(/\D/g, '')) || 0) -
                        (Number(hargaBeliStr.replace(/\D/g, '')) || 0)
                    )}
                  </span>
                </div>

                {/* Stok & Satuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Jumlah Stok:</label>
                    <Input
                      type="text"
                      value={
                        stokStr
                          ? Number(stokStr.replace(/\D/g, '')).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => setStokStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="h-10 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Satuan Porsi:</label>
                    <select
                      value={satuan}
                      onChange={(e) => setSatuan(e.target.value)}
                      className="h-10 w-full px-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-800"
                    >
                      <option value="Gelas">Gelas</option>
                      <option value="Cangkir">Cangkir</option>
                      <option value="Porsi">Porsi</option>
                      <option value="Bungkus">Bungkus</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Mangkok">Mangkok</option>
                    </select>
                  </div>
                </div>

                {/* Emoji Icon Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Ikon Produk:</label>
                  <div className="flex gap-2 flex-wrap">
                    {['☕', '🍵', '🧃', '🍜', '🍞', '🥟', '🍛', '🍿', '🥪', '🍰', '⚡', '🍊'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setGambar(emoji)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-transform cursor-pointer ${
                          gambar === emoji
                            ? 'bg-amber-100 border-amber-400 scale-105'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Konsinyasi Partner Option */}
                {isKonsinyasi && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-xs font-bold text-amber-900 block">
                      Mitra Konsinyasi:
                    </span>
                    <select
                      value={idMitra}
                      onChange={(e) => setIdMitra(e.target.value)}
                      className="h-9 w-full px-3 rounded-xl border border-amber-300 bg-white text-xs font-bold text-zinc-800"
                    >
                      {safeMitraList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nama_mitra} ({m.skema_bagi_hasil})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSheetOpen(false)}
                    className="flex-1 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Menu'}
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
