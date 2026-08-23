import React, { useState, useMemo } from 'react';
import { AttendanceLog, WORKER_ATTENDANCE_DRIVE_URL, AppSettings } from '../types';
import { ApiService } from '../services/api';
import { LocalStorageService } from '../services/storage';
import { 
  Camera, 
  Clock, 
  ExternalLink, 
  Download, 
  Search, 
  Calendar, 
  UserCheck, 
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  X,
  Trash2,
  FolderDown,
  Sparkles,
  UploadCloud,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface WorkerAttendanceLogViewProps {
  logs: AttendanceLog[];
  settings?: AppSettings;
  onDeleteLog?: (id: string) => void;
  onUpdateLogs?: (logs: AttendanceLog[]) => void;
  onClearLogs?: () => void;
  onOpenGasModal?: () => void;
  onBack?: () => void;
}

export const WorkerAttendanceLogView: React.FC<WorkerAttendanceLogViewProps> = ({
  logs = [],
  settings,
  onDeleteLog,
  onUpdateLogs,
  onClearLogs,
  onOpenGasModal,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; filename: string } | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch = 
        log.worker_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.file_name && log.file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.catatan && log.catatan.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchDate = !dateFilter || log.tanggal_display === dateFilter;

      return matchSearch && matchDate;
    });
  }, [logs, searchTerm, dateFilter]);

  const handleDownloadPhoto = (photoUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncSinglePhoto = async (log: AttendanceLog) => {
    if (!settings || !settings.gas_web_app_url || !settings.gas_web_app_url.trim()) {
      setSyncFeedback({
        success: false,
        message: 'URL Google Apps Script belum diatur. Klik "Setup Google Apps Script" untuk menghubungkan agar foto bisa otomatis masuk ke Google Drive.',
      });
      return;
    }

    if (!log.foto_data_url) {
      setSyncFeedback({ success: false, message: 'Data foto tidak tersedia untuk log ini.' });
      return;
    }

    setSyncingId(log.id);
    setSyncFeedback(null);

    const res = await ApiService.uploadAttendancePhoto(log, settings);
    setSyncingId(null);

    if (res.success) {
      const updated = logs.map((item) => {
        if (item.id === log.id) {
          return {
            ...item,
            upload_status: 'TERUPLOAD_DRIVE' as const,
            drive_file_id: res.drive_file_id,
            drive_file_url: res.drive_file_url,
          };
        }
        return item;
      });
      LocalStorageService.saveAttendanceLogs(updated);
      if (onUpdateLogs) onUpdateLogs(updated);
      setSyncFeedback({
        success: true,
        message: `Foto ${log.file_name} berhasil diunggah ke Google Drive!`,
      });
    } else {
      setSyncFeedback({
        success: false,
        message: res.message || 'Gagal mengunggah foto ke Google Drive.',
      });
    }
  };

  const handleSyncAllPending = async () => {
    if (!settings || !settings.gas_web_app_url || !settings.gas_web_app_url.trim()) {
      setSyncFeedback({
        success: false,
        message: 'URL Google Apps Script belum diatur. Silakan atur di menu Integrasi Spreadsheet.',
      });
      return;
    }

    const pendingLogs = logs.filter((l) => l.foto_data_url && l.upload_status !== 'TERUPLOAD_DRIVE');
    if (pendingLogs.length === 0) {
      setSyncFeedback({ success: true, message: 'Semua foto selfie sudah terunggah ke Google Drive!' });
      return;
    }

    setIsBulkSyncing(true);
    setSyncFeedback(null);

    let successCount = 0;
    let currentLogs = [...logs];

    for (const item of pendingLogs) {
      const res = await ApiService.uploadAttendancePhoto(item, settings);
      if (res.success) {
        successCount++;
        currentLogs = currentLogs.map((l) =>
          l.id === item.id
            ? { ...l, upload_status: 'TERUPLOAD_DRIVE' as const, drive_file_id: res.drive_file_id, drive_file_url: res.drive_file_url }
            : l
        );
      }
    }

    LocalStorageService.saveAttendanceLogs(currentLogs);
    if (onUpdateLogs) onUpdateLogs(currentLogs);
    setIsBulkSyncing(false);

    setSyncFeedback({
      success: successCount > 0,
      message: `${successCount} dari ${pendingLogs.length} foto berhasil diunggah ke Google Drive!`,
    });
  };

  const hasGasUrl = Boolean(settings?.gas_web_app_url && settings.gas_web_app_url.trim());
  const pendingCount = logs.filter((l) => l.foto_data_url && l.upload_status !== 'TERUPLOAD_DRIVE').length;

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>Log Absen Masuk Worker (Selfie)</span>
                <Badge variant="outline" className="text-[10px] font-bold border-amber-300 bg-amber-50 text-amber-800">
                  {logs.length} Data
                </Badge>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Monitoring presensi kasir BIMA lengkap dengan jam masuk, format nama file & foto selfie terverifikasi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={handleSyncAllPending}
              disabled={isBulkSyncing}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold gap-1.5 rounded-xl h-9 cursor-pointer shadow-xs"
            >
              {isBulkSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>{isBulkSyncing ? 'Mengunggah...' : `Sync Semua ke Drive (${pendingCount})`}</span>
            </Button>
          )}

          <a
            href={WORKER_ATTENDANCE_DRIVE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs font-bold transition-all shadow-xs"
          >
            <FolderDown className="w-4 h-4 text-amber-400" />
            <span>Buka Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs font-bold rounded-xl h-9"
            >
              Kembali
            </Button>
          )}
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            syncFeedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-zinc-500 hover:text-zinc-800 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Google Drive Status & Connection Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hasGasUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                <span>Folder Google Drive Presensi:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  Folder ID: 1B-UgnmWX1zkPjNhy19jVSmrSbnZjr_D5
                </span>
              </h4>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono break-all">
              {WORKER_ATTENDANCE_DRIVE_URL}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGasModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenGasModal}
                className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 rounded-xl h-8 gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>{hasGasUrl ? 'Pengaturan Apps Script' : 'Setup Apps Script'}</span>
              </Button>
            )}

            <a
              href={WORKER_ATTENDANCE_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-colors"
            >
              <span>Buka Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Explain how photos enter Google Drive */}
        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 space-y-1.5">
          <div className="flex items-start gap-2 font-medium text-amber-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Cara Foto Masuk ke Google Drive:</strong>
            </span>
          </div>
          <p className="pl-6 text-zinc-400 leading-relaxed">
            Foto selfie kasir BIMA otomatis tersimpan aman di browser dalam format nama standar <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded font-mono text-[10px]">YYYY-MM-DD_HHmmss_BIMA.jpg</code>. 
            Untuk mengunggahnya secara langsung dan otomatis ke Google Drive tanpa download manual, pastikan <strong>Google Apps Script Web App</strong> sudah di-deploy dengan akses <em>"Anyone"</em> dan URL-nya dimasukkan di menu Pengaturan.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <Input
            type="text"
            placeholder="Cari nama worker atau nama file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs bg-white rounded-xl border-zinc-200"
          />
        </div>

        <div className="relative">
          <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 h-10 text-xs bg-white rounded-xl border-zinc-200"
          />
        </div>

        {dateFilter && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter('')}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Reset Filter Tanggal
            </Button>
          </div>
        )}
      </div>

      {/* Attendance List */}
      {filteredLogs.length === 0 ? (
        <Card className="rounded-2xl border border-zinc-200 shadow-xs">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-zinc-700">Belum Ada Catatan Absen Selfie</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Saat kasir (BIMA) melakukan absen masuk di portal awal, foto selfie dan waktu masuk akan otomatis tercatat di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredLogs.map((log) => {
            const isUploaded = log.upload_status === 'TERUPLOAD_DRIVE';
            const isSyncing = syncingId === log.id;

            return (
              <Card
                key={log.id}
                className="rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:border-zinc-300 transition-all bg-white"
              >
                <CardContent className="p-4 flex gap-3.5">
                  {/* Photo Thumbnail */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 shrink-0 group">
                    {log.foto_data_url ? (
                      <>
                        <img
                          src={log.foto_data_url}
                          alt={`Selfie ${log.worker_nama}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPhoto({
                              url: log.foto_data_url!,
                              title: `${log.worker_nama} - ${log.jam_display}`,
                              filename: log.file_name,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          title="Perbesar Foto"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-2 text-center">
                        <Camera className="w-6 h-6 mb-1 text-zinc-400" />
                        <span className="text-[9px]">Tersimpan di Drive</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-zinc-900">{log.worker_nama}</span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-black uppercase px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            {log.tipe}
                          </Badge>
                        </div>

                        <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          {log.jam_display}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-500 flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{log.tanggal_display}</span>
                        </div>

                        {/* Status Drive Upload Badge */}
                        {isUploaded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Di Google Drive</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                            <span>Tersimpan Lokal</span>
                          </span>
                        )}
                      </div>

                      {/* Standardized File Name */}
                      <div className="p-1.5 bg-zinc-50 rounded-lg border border-zinc-200/80 mb-2">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                          File Standar:
                        </span>
                        <p className="text-[10px] font-mono text-zinc-700 font-bold truncate">
                          {log.file_name}
                        </p>
                      </div>

                      {log.catatan && (
                        <p className="text-[11px] text-zinc-600 italic bg-zinc-50/60 px-2 py-1 rounded">
                          "{log.catatan}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 mt-2 flex-wrap">
                      {log.foto_data_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPhoto(log.foto_data_url!, log.file_name)}
                          className="text-[11px] h-7 px-2 font-bold gap-1 rounded-lg border-zinc-200 hover:bg-zinc-100 cursor-pointer"
                          title="Unduh File Foto Sesuai Format"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh</span>
                        </Button>
                      )}

                      {/* Upload to Google Drive button */}
                      {log.foto_data_url && !isUploaded && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSyncSinglePhoto(log)}
                          disabled={isSyncing}
                          className="text-[11px] h-7 px-2 font-bold gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                          title="Unggah Foto Langsung ke Google Drive"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{isSyncing ? 'Upload...' : 'Upload Drive'}</span>
                        </Button>
                      )}

                      {log.drive_file_url && (
                        <a
                          href={log.drive_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] h-7 px-2 font-bold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Lihat File</span>
                        </a>
                      )}

                      {onDeleteLog && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDeleteLog(log.id)}
                          className="h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg ml-auto cursor-pointer"
                          title="Hapus Catatan Absen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightbox / Zoom Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden max-w-lg w-full p-4 space-y-3 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{selectedPhoto.title}</h4>
                  <p className="text-[10px] font-mono text-zinc-400">{selectedPhoto.filename}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPhoto(null)}
                  className="h-8 w-8 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black border border-zinc-800">
                <img
                  src={selectedPhoto.url}
                  alt="Selfie Zoom"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  onClick={() => handleDownloadPhoto(selectedPhoto.url, selectedPhoto.filename)}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs gap-1.5 rounded-xl h-9 px-4"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File ({selectedPhoto.filename})</span>
                </Button>

                <a
                  href={WORKER_ATTENDANCE_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Buka Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
