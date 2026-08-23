import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/googleAppsScriptCode';
import { ApiService } from '../services/api';
import { AppSettings } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Code2,
  Settings2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [gasUrl, setGasUrl] = useState(settings.gas_web_app_url || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'settings'>('guide');

  const [settingUpDb, setSettingUpDb] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ success: false, message: 'Harap masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setTestResult(null);

    const res = await ApiService.testGasConnection(gasUrl.trim());
    setTesting(false);
    setTestResult({
      success: res.success,
      message: res.message || (res.success ? 'Koneksi ke Google Sheets Berhasil & Aktif!' : 'Gagal terhubung.'),
    });

    if (res.success) {
      onSaveSettings({ ...settings, gas_web_app_url: gasUrl.trim() });
    }
  };

  const handleInitDatabase = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ success: false, message: 'Harap masukkan URL Web App terlebih dahulu.' });
      return;
    }
    setSettingUpDb(true);
    setTestResult(null);

    const res = await ApiService.setupDatabaseRemote(gasUrl.trim());
    setSettingUpDb(false);
    setTestResult({
      success: res.success,
      message: res.message || (res.success ? 'Seluruh 12 Sheet Database Berhasil Diinisialisasi Lengkap!' : 'Gagal setup database.'),
    });

    if (res.success) {
      onSaveSettings({ ...settings, gas_web_app_url: gasUrl.trim() });
    }
  };

  const handleSaveUrl = () => {
    onSaveSettings({ ...settings, gas_web_app_url: gasUrl.trim() });
    setTestResult({ success: true, message: 'URL Web App berhasil disimpan.' });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-base text-foreground">
                Integrasi Backend Google Spreadsheet (Apps Script)
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              id="btn-close-gas-modal"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b px-6 pt-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="guide" className="text-xs gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Panduan Setup</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Kode Backend</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Konfigurasi URL</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            {activeTab === 'guide' && (
              <div className="space-y-4 text-xs">
                <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-lg text-foreground leading-relaxed">
                  <strong>💡 Catatan Warkop TWG:</strong> Aplikasi POS ini menggunakan sistem <em>Hybrid Offline-First</em>. Semua transaksi, stok produk, dan log konsinyasi tetap tersimpan aman di browser Anda dan langsung sinkron ke Google Spreadsheet saat Anda menghubungkan Web App URL!
                </div>

                <div className="space-y-3 font-normal">
                  <div className="flex gap-3 items-start bg-muted/20 p-3.5 rounded-lg border">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">Buat Spreadsheet Baru di Google Drive</p>
                      <p className="text-muted-foreground">Buka Google Drive, buat Google Sheet baru dan beri judul <span className="font-medium text-foreground">"DATABASE WARKOP TWG"</span>.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-muted/20 p-3.5 rounded-lg border">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Buka Apps Script & Salin Kode Backend</p>
                      <p className="text-muted-foreground">Di spreadsheet, klik menu <strong>Ekstensi &gt; Apps Script</strong>. Hapus kode bawaan dan paste kode lengkap dari tab <strong>"Kode Backend (Code.gs)"</strong>.</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyCode}
                        className="text-xs h-7 gap-1.5 mt-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Kode Tersalin!' : 'Salin Kode Sekarang'}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-muted/20 p-3.5 rounded-lg border">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Deploy Sebagai Web App</p>
                      <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                        <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong> di pojok kanan atas.</li>
                        <li>Pilih jenis: <strong>Web app</strong> (Aplikasi web).</li>
                        <li>Execute as: <strong>Me (email Anda)</strong></li>
                        <li>Who has access: <strong className="text-foreground">Anyone (Siapa saja)</strong></li>
                        <li>Klik <strong>Deploy</strong>, izinkan akses akun Google bila diminta.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-muted/20 p-3.5 rounded-lg border">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Masukkan Web App URL</p>
                      <p className="text-muted-foreground">Salin URL Web App yang berakhiran <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">/exec</code> lalu paste di tab <strong>"Konfigurasi URL"</strong>.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('settings')}
                        className="text-xs h-7 gap-1.5 mt-1"
                      >
                        <span>Ke Tab Konfigurasi &gt;</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-amber-500/10 p-3.5 rounded-lg border border-amber-500/20">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold shrink-0 mt-0.5">
                      5
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Upload Otomatis Foto Selfie ke Google Drive</p>
                      <p className="text-muted-foreground">
                        Kode Google Apps Script terbaru sudah dilengkapi fungsi <code className="bg-amber-100 dark:bg-zinc-800 text-amber-900 dark:text-amber-300 px-1 py-0.5 rounded font-mono text-[11px]">handleUploadAttendancePhoto</code>. 
                        Setiap kali kasir BIMA absen selfie saat login, file foto dengan format <code className="bg-amber-100 dark:bg-zinc-800 text-amber-900 dark:text-amber-300 px-1 py-0.5 rounded font-mono text-[11px]">YYYY-MM-DD_HHmmss_BIMA.jpg</code> otomatis terunggah ke Google Drive folder ID <code className="font-mono text-[11px] font-bold">1B-UgnmWX1zkPjNhy19jVSmrSbnZjr_D5</code> dan tercatat di sheet <code className="font-mono text-[11px]">Log_Absensi</code>!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                  <div>
                    <span className="font-semibold text-xs text-foreground">Google Apps Script (Code.gs) - 12 Sheet Database</span>
                    <p className="text-[11px] text-muted-foreground">Master Produk, Transaksi POS, Detail Item, Opex, Kulakan, Mitra, Absensi Drive, Shift</p>
                  </div>
                  <Button
                    id="btn-copy-gas-code-tab"
                    size="sm"
                    onClick={handleCopyCode}
                    className="text-xs h-8 gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Copy Semua Kode'}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <span className="font-semibold text-foreground">1. Users</span>
                    <p className="text-muted-foreground text-[10px]">Owner & Kasir PIN</p>
                  </div>
                  <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-md">
                    <span className="font-semibold text-foreground">2. Produk</span>
                    <p className="text-muted-foreground text-[10px]">Menu & Stok Bahan</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                    <span className="font-semibold text-foreground">3. Transaksi_POS</span>
                    <p className="text-muted-foreground text-[10px]">Header Invoice POS</p>
                  </div>
                  <div className="p-2 bg-emerald-600/10 border border-emerald-600/20 rounded-md">
                    <span className="font-semibold text-foreground">4. Detail_Item_Transaksi</span>
                    <p className="text-muted-foreground text-[10px]">Rincian & Laba Kotor</p>
                  </div>
                  <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-md">
                    <span className="font-semibold text-foreground">5. Pemasukan_Harian</span>
                    <p className="text-muted-foreground text-[10px]">Kas Warung Masuk</p>
                  </div>
                  <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-md">
                    <span className="font-semibold text-foreground">6. Pengeluaran_Kulakan</span>
                    <p className="text-muted-foreground text-[10px]">Bahan Baku & Grosir</p>
                  </div>
                  <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-md">
                    <span className="font-semibold text-foreground">7. Opex</span>
                    <p className="text-muted-foreground text-[10px]">Beban Operasional</p>
                  </div>
                  <div className="p-2 bg-amber-600/10 border border-amber-600/20 rounded-md">
                    <span className="font-semibold text-foreground">8. Mitra_Konsinyasi</span>
                    <p className="text-muted-foreground text-[10px]">Daftar Vendor Titipan</p>
                  </div>
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                    <span className="font-semibold text-foreground">9. Log_Konsinyasi</span>
                    <p className="text-muted-foreground text-[10px]">Bagi Hasil & Settlement</p>
                  </div>
                  <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-md">
                    <span className="font-semibold text-foreground">10. Log_Absensi</span>
                    <p className="text-muted-foreground text-[10px]">Selfie & Link GDrive</p>
                  </div>
                  <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-md">
                    <span className="font-semibold text-foreground">11. Shift_Kasir</span>
                    <p className="text-muted-foreground text-[10px]">Tutup Shift & Kas Laci</p>
                  </div>
                  <div className="p-2 bg-slate-500/10 border border-slate-500/20 rounded-md">
                    <span className="font-semibold text-foreground">12. Kas_Warung_Saldo</span>
                    <p className="text-muted-foreground text-[10px]">Mutasi Saldo Kas</p>
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-zinc-950 text-zinc-100 font-mono text-[11px] rounded-lg overflow-x-auto max-h-96 border leading-relaxed">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-xl border space-y-3">
                  <div>
                    <label className="block font-semibold text-xs text-foreground">
                      URL Web App Google Apps Script
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Masukkan URL yang didapat setelah Deploy Web App (contoh: <span className="font-mono text-[11px]">https://script.google.com/macros/s/.../exec</span>)
                    </p>
                  </div>
                  
                  <Input
                    id="input-gas-url"
                    type="url"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="font-mono text-xs"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      id="btn-test-gas-connection"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testing || settingUpDb}
                      className="text-xs gap-1.5"
                    >
                      {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>{testing ? 'Menguji Koneksi...' : '1. Tes Koneksi'}</span>
                    </Button>

                    <Button
                      id="btn-init-database"
                      variant="secondary"
                      size="sm"
                      onClick={handleInitDatabase}
                      disabled={testing || settingUpDb}
                      className="text-xs gap-1.5"
                    >
                      {settingUpDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />}
                      <span>{settingUpDb ? 'Membuat 12 Sheet...' : '2. Setup Seluruh 12 Sheet'}</span>
                    </Button>

                    <Button
                      id="btn-save-gas-url"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveUrl}
                      className="text-xs gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan URL</span>
                    </Button>
                  </div>
                </div>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                      testResult.success
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-destructive/10 border-destructive/20 text-destructive'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{testResult.success ? 'Koneksi Berhasil!' : 'Pemberitahuan Koneksi:'}</p>
                      <p className="mt-0.5">{testResult.message}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Tutup
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

