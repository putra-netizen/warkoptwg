import React, { useState, useRef, useEffect } from 'react';
import { User, AttendanceLog, WORKER_ATTENDANCE_DRIVE_URL, AppSettings } from '../types';
import { ApiService } from '../services/api';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UploadCloud, 
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Loader2,
  FolderDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface WorkerClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerUser: User;
  settings?: AppSettings;
  onClockInSuccess: (attendance: AttendanceLog) => void;
}

export const WorkerClockInModal: React.FC<WorkerClockInModalProps> = ({
  isOpen,
  onClose,
  workerUser,
  settings,
  onClockInSuccess,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [catatan, setCatatan] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep live time ticking
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Start Camera Stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPhotoDataUrl(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung oleh browser. Anda dapat mengunggah file foto selfie.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Izin kamera ditolak atau belum aktif. Silakan gunakan tombol upload foto selfie.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror image for natural selfie feel
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoDataUrl(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error('Failed to capture photo:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoDataUrl(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  // Generate standardized file name: YYYY-MM-DD_HHmmss_[NAMA_WORKER].jpg
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = currentTime.getFullYear();
  const mm = pad(currentTime.getMonth() + 1);
  const dd = pad(currentTime.getDate());
  const hh = pad(currentTime.getHours());
  const min = pad(currentTime.getMinutes());
  const ss = pad(currentTime.getSeconds());
  
  const workerCleanName = (workerUser.nama || 'BIMA').toUpperCase().replace(/\s+/g, '_');
  const formattedFileName = `${yyyy}-${mm}-${dd}_${hh}${min}${ss}_${workerCleanName}.jpg`;
  const tanggalDisplay = `${yyyy}-${mm}-${dd}`;
  const jamDisplay = `${hh}:${min}:${ss}`;

  const handleConfirmClockIn = async () => {
    if (!photoDataUrl) {
      alert('Foto selfie wajib diambil sebelum memulai shift!');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Memproses presensi & mengunggah ke Google Drive...');

    const attendanceRecord: AttendanceLog = {
      id: 'att-' + Date.now(),
      worker_nama: workerUser.nama || 'BIMA',
      worker_id: workerUser.id || 'u-1',
      tipe: 'MASUK',
      waktu: currentTime.toISOString(),
      tanggal_display: tanggalDisplay,
      jam_display: jamDisplay,
      file_name: formattedFileName,
      foto_data_url: photoDataUrl,
      google_drive_folder_url: WORKER_ATTENDANCE_DRIVE_URL,
      upload_status: 'PENDING',
      status: 'HADIR',
      catatan: catatan.trim() || undefined,
    };

    if (settings && settings.gas_web_app_url && settings.gas_web_app_url.trim()) {
      try {
        const uploadRes = await ApiService.uploadAttendancePhoto(attendanceRecord, settings);
        if (uploadRes.success) {
          attendanceRecord.upload_status = 'TERUPLOAD_DRIVE';
          attendanceRecord.drive_file_id = uploadRes.drive_file_id;
          attendanceRecord.drive_file_url = uploadRes.drive_file_url;
        } else {
          attendanceRecord.upload_status = 'PENDING';
        }
      } catch (e) {
        console.warn('Upload error:', e);
        attendanceRecord.upload_status = 'PENDING';
      }
    } else {
      attendanceRecord.upload_status = 'PENDING';
    }

    setIsUploading(false);
    onClockInSuccess(attendanceRecord);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-zinc-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Absen Masuk Kasir</span>
                  <span className="text-[10px] bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black px-1.5 py-0.5 rounded">
                    Wajib Selfie
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Worker: <strong className="text-amber-400">{workerUser.nama || 'BIMA'}</strong>
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Live Clock & Timestamp Card */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                    Pukul Masuk Tercatat
                  </span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {jamDisplay} <span className="text-xs text-zinc-400 font-sans font-normal">WIB</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                  Tanggal
                </span>
                <span className="text-xs font-bold text-zinc-300 font-mono">
                  {tanggalDisplay}
                </span>
              </div>
            </div>

            {/* Camera / Photo Preview Frame */}
            <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-zinc-800 flex flex-col items-center justify-center shadow-inner group">
              {photoDataUrl ? (
                // Photo preview after capture
                <div className="relative w-full h-full">
                  <img
                    src={photoDataUrl}
                    alt="Selfie Absen Masuk"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Foto Selfie Berhasil Diambil
                      </span>
                      <p className="text-[10px] font-mono text-zinc-300 truncate max-w-[200px]">
                        {formattedFileName}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRetake}
                      className="text-xs h-7 gap-1 bg-zinc-800/90 hover:bg-zinc-700 text-white rounded-lg cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Ulangi</span>
                    </Button>
                  </div>
                </div>
              ) : (
                // Live camera stream
                <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover -scale-x-100 ${
                      cameraActive ? 'block' : 'hidden'
                    }`}
                  />

                  {!cameraActive && (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed px-2">
                        {cameraError || 'Mempersiapkan kamera depan...'}
                      </p>
                      <Button
                        size="sm"
                        onClick={startCamera}
                        className="text-xs h-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Akses Kamera</span>
                      </Button>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute inset-x-0 bottom-4 flex justify-center z-10">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={isCapturing}
                        className="h-14 w-14 rounded-full bg-amber-400 hover:bg-amber-300 border-4 border-white/80 shadow-xl flex items-center justify-center text-zinc-950 cursor-pointer active:scale-90 transition-transform"
                        title="Ambil Foto Selfie"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alternate upload button if user prefers gallery / camera app */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] text-zinc-400">Atau gunakan file foto:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-[11px] font-bold border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 gap-1.5 rounded-lg cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih Foto dari Perangkat</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Target Google Drive Info & File Name Badge */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-semibold">Nama File Foto Standar:</span>
                <span className="font-mono font-bold text-amber-400 text-[11px]">
                  {formattedFileName}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-900">
                <span className="text-zinc-400">Penyimpanan Folder Drive:</span>
                <a
                  href={WORKER_ATTENDANCE_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline text-[10px]"
                >
                  <span>Google Drive Absen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Optional Shift Note */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Catatan Shift Masuk (Opsional):
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Shift Pagi / Siang, Kondisi Bar Siap"
                className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Submit Clock In */}
            <div className="pt-2">
              <Button
                id="btn-confirm-clock-in"
                onClick={handleConfirmClockIn}
                disabled={!photoDataUrl || isUploading}
                className={`w-full h-11 text-xs font-black gap-2 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-[0.99] ${
                  photoDataUrl && !isUploading
                    ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-500/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    <span>{uploadMessage || 'Menyimpan Presensi...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Absen Masuk & Mulai Shift POS</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
