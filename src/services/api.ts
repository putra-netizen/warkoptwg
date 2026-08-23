import { 
  TransactionPOS, 
  Product, 
  MitraKonsinyasi, 
  PemasukanHarian, 
  PengeluaranKulakan, 
  Opex,
  AppSettings,
  AttendanceLog
} from '../types';
import { LocalStorageService } from './storage';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  isLocalOnly?: boolean;
  drive_file_id?: string;
  drive_file_url?: string;
}

export const ApiService = {
  // Test connection to Google Apps Script
  testGasConnection: async (gasUrl: string): Promise<ApiResponse> => {
    if (!gasUrl || !gasUrl.trim()) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      // In Google Apps Script, redirect 302 occurs on web apps. We use POST JSON or no-cors / mode cors
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'ping' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.warn('GAS Connection test failed:', err);
      return {
        success: false,
        message: 'Gagal terhubung ke Google Apps Script: ' + (err.message || 'Periksa URL dan pastikan Web App di-deploy dengan opsi "Who has access: Anyone"'),
      };
    }
  },

  // Save Transaction
  createTransaction: async (trx: TransactionPOS, settings: AppSettings): Promise<ApiResponse> => {
    // 1. Always save locally first for instant, 100% reliable POS response
    const transactions = LocalStorageService.getTransactions();
    LocalStorageService.saveTransactions([trx, ...transactions]);

    // Update local product stocks
    const products = LocalStorageService.getProducts();
    const updatedProducts = products.map(prod => {
      const soldItem = trx.items.find(it => it.produk_id === prod.id);
      if (soldItem) {
        return { ...prod, stok: Math.max(0, prod.stok - soldItem.qty) };
      }
      return prod;
    });
    LocalStorageService.saveProducts(updatedProducts);

    // Update consignment log if any item is consignment
    const logs = LocalStorageService.getLogKonsinyasi();
    const newLogs = [...logs];
    trx.items.forEach(item => {
      if (item.is_konsinyasi && item.id_mitra) {
        const prod = products.find(p => p.id === item.produk_id);
        const mitraList = LocalStorageService.getMitra();
        const mitra = mitraList.find(m => m.id === item.id_mitra);
        
        let bagMitra = 0;
        if (prod?.skema_mitra_tipe === 'nominal' && prod.skema_mitra_nilai) {
          bagMitra = prod.skema_mitra_nilai * item.qty;
        } else if (prod?.skema_mitra_nilai) {
          bagMitra = (item.subtotal * prod.skema_mitra_nilai) / 100;
        } else {
          bagMitra = item.subtotal * 0.75; // default 75%
        }
        const bagWarkop = item.subtotal - bagMitra;

        newLogs.unshift({
          id: 'log-' + Math.random().toString(36).substring(2, 9),
          tanggal: trx.tanggal,
          id_mitra: item.id_mitra,
          nama_mitra: mitra?.nama_mitra || 'Mitra Warkop',
          id_produk: item.produk_id,
          nama_produk: item.nama,
          no_invoice: trx.no_invoice,
          qty_terjual: item.qty,
          total_penjualan: item.subtotal,
          bagian_mitra: bagMitra,
          bagian_warkop: bagWarkop,
          status_settle: 'BELUM SETTLE',
        });
      }
    });
    LocalStorageService.saveLogKonsinyasi(newLogs);

    // 2. If GAS URL is configured, sync in background
    if (settings.gas_web_app_url && settings.gas_web_app_url.trim()) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'createTransaction',
            data: trx,
          }),
        }).catch(e => console.warn('Background sync transaction to GAS failed:', e));
      } catch (e) {
        console.warn('Sync error:', e);
      }
    }

    return { success: true, message: 'Transaksi berhasil disimpan!' };
  },

  // Save / Update Product
  saveProduct: async (product: Product, settings: AppSettings): Promise<ApiResponse> => {
    const products = LocalStorageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...products];
      updated[index] = product;
    } else {
      updated = [product, ...products];
    }
    LocalStorageService.saveProducts(updated);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveProduct',
            data: product,
          }),
        }).catch(e => console.warn('Sync product to GAS failed:', e));
      } catch (e) {}
    }

    return { success: true, message: 'Produk berhasil disimpan' };
  },

  // Delete Product
  deleteProduct: async (id: string, settings: AppSettings): Promise<ApiResponse> => {
    const products = LocalStorageService.getProducts();
    const updated = products.filter(p => p.id !== id);
    LocalStorageService.saveProducts(updated);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'deleteProduct',
            data: { id },
          }),
        }).catch(e => console.warn('Sync delete product failed:', e));
      } catch (e) {}
    }

    return { success: true, message: 'Produk berhasil dihapus' };
  },

  // Save / Update Mitra
  saveMitra: async (mitra: MitraKonsinyasi, settings: AppSettings): Promise<ApiResponse> => {
    const mitras = LocalStorageService.getMitra();
    const index = mitras.findIndex(m => m.id === mitra.id);
    let updated: MitraKonsinyasi[];
    if (index >= 0) {
      updated = [...mitras];
      updated[index] = mitra;
    } else {
      updated = [mitra, ...mitras];
    }
    LocalStorageService.saveMitra(updated);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveMitra',
            data: mitra,
          }),
        }).catch(e => console.warn('Sync mitra to GAS failed:', e));
      } catch (e) {}
    }

    return { success: true, message: 'Data mitra berhasil disimpan' };
  },

  // Settle Consignment
  settleConsignmentLogs: async (logIds: string[], settings: AppSettings): Promise<ApiResponse> => {
    const logs = LocalStorageService.getLogKonsinyasi();
    const now = new Date().toISOString();
    const updated = logs.map(log => {
      if (logIds.includes(log.id)) {
        return {
          ...log,
          status_settle: 'SUDAH SETTLE' as const,
          settled_at: now,
        };
      }
      return log;
    });
    LocalStorageService.saveLogKonsinyasi(updated);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'settleConsignment',
            data: { log_ids: logIds },
          }),
        }).catch(e => console.warn('Sync settle to GAS failed:', e));
      } catch (e) {}
    }

    return { success: true, message: 'Status settlement berhasil diupdate' };
  },

  // Add Pemasukan
  addPemasukan: async (item: PemasukanHarian, settings: AppSettings): Promise<ApiResponse> => {
    const list = LocalStorageService.getPemasukan();
    LocalStorageService.savePemasukan([item, ...list]);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'addPemasukan', data: item }),
        }).catch(e => console.warn(e));
      } catch (e) {}
    }

    return { success: true, message: 'Pemasukan berhasil dicatat' };
  },

  // Add Pengeluaran Kulakan
  addPengeluaranKulakan: async (item: PengeluaranKulakan, settings: AppSettings): Promise<ApiResponse> => {
    const list = LocalStorageService.getPengeluaran();
    LocalStorageService.savePengeluaran([item, ...list]);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'addPengeluaran', data: item }),
        }).catch(e => console.warn(e));
      } catch (e) {}
    }

    return { success: true, message: 'Pengeluaran kulakan berhasil dicatat' };
  },

  // Add Opex
  addOpex: async (item: Opex, settings: AppSettings): Promise<ApiResponse> => {
    const list = LocalStorageService.getOpex();
    LocalStorageService.saveOpex([item, ...list]);

    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'addOpex', data: item }),
        }).catch(e => console.warn(e));
      } catch (e) {}
    }

    return { success: true, message: 'Biaya operasional berhasil dicatat' };
  },

  // Trigger Remote Database Setup
  setupDatabaseRemote: async (gasUrl: string): Promise<ApiResponse> => {
    if (!gasUrl || !gasUrl.trim()) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'setupDatabase' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.warn('GAS Setup failed:', err);
      return {
        success: false,
        message: 'Gagal inisialisasi database: ' + (err.message || 'Periksa koneksi Google Apps Script'),
      };
    }
  },

  // Close Cashier Shift
  closeShift: async (shiftData: any, settings: AppSettings): Promise<ApiResponse> => {
    if (settings.gas_web_app_url) {
      try {
        fetch(settings.gas_web_app_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'closeShift', data: shiftData }),
        }).catch(e => console.warn(e));
      } catch (e) {}
    }
    return { success: true, message: 'Tutup shift berhasil disimpan' };
  },

  // Upload Attendance Photo to Google Drive via Google Apps Script
  uploadAttendancePhoto: async (log: AttendanceLog, settings: AppSettings): Promise<ApiResponse> => {
    if (!settings.gas_web_app_url || !settings.gas_web_app_url.trim()) {
      return {
        success: false,
        isLocalOnly: true,
        message: 'URL Google Apps Script belum dihubungkan. Foto selfie tersimpan aman di aplikasi.',
      };
    }

    try {
      const response = await fetch(settings.gas_web_app_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'uploadAttendancePhoto',
          data: {
            id: log.id,
            worker_nama: log.worker_nama,
            tanggal_display: log.tanggal_display,
            jam_display: log.jam_display,
            waktu: log.waktu,
            tipe: log.tipe,
            file_name: log.file_name,
            base64: log.foto_data_url,
            catatan: log.catatan,
            folder_id: '1B-UgnmWX1zkPjNhy19jVSmrSbnZjr_D5',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.warn('Upload attendance photo to GAS error:', err);
      return {
        success: false,
        message: 'Gagal mengunggah foto ke Google Drive: ' + (err.message || 'Cek koneksi internet atau permission Web App'),
      };
    }
  },
};
