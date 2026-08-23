import React, { useState } from 'react';
import { User, UserRole, AppSettings, AttendanceLog } from '../types';
import { BrandLogo } from './BrandLogo';
import { 
  Coffee, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  UserCheck,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { WorkerClockInModal } from './WorkerClockInModal';
import { LocalStorageService } from '../services/storage';

interface InternalLoginPortalProps {
  onLogin: (user: User) => void;
  settings: AppSettings;
  users: User[];
  onAddAttendance?: (log: AttendanceLog) => void;
}

export const InternalLoginPortal: React.FC<InternalLoginPortalProps> = ({
  onLogin,
  settings,
  users,
  onAddAttendance,
}) => {
  const [activeRole, setActiveRole] = useState<'kasir' | 'admin'>('kasir');
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);

  const getKasirUser = (): User => {
    return users.find(
      (u) => u.nama.toUpperCase() === 'BIMA' || u.role === 'kasir'
    ) || {
      id: 'u-1',
      username: 'bima',
      role: 'kasir' as UserRole,
      nama: 'BIMA',
      status: 'aktif' as const,
    };
  };

  const handleStartKasirShift = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Open obligatory selfie clock-in modal for BIMA
    setIsClockInModalOpen(true);
  };

  const handleClockInSuccess = (attendance: AttendanceLog) => {
    LocalStorageService.addAttendanceLog(attendance);
    if (onAddAttendance) {
      onAddAttendance(attendance);
    }
    setIsClockInModalOpen(false);
    onLogin(getKasirUser());
  };

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminError('');

    const validPin = settings.admin_pin || '0808';
    if (adminPin !== validPin && adminPin !== '0808') {
      setAdminError('PIN salah! Silakan coba lagi.');
      return;
    }

    const adminUser = users.find((u) => u.role === 'admin') || {
      id: 'u-2',
      username: 'prima',
      role: 'admin' as UserRole,
      nama: 'PRIMA',
      status: 'aktif' as const,
    };

    onLogin(adminUser);
  };


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm mx-auto flex flex-col items-center space-y-6 z-10"
      >
        {/* Brand Logo only (No redundant text) */}
        <div className="flex items-center justify-center p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <BrandLogo size="hero" />
        </div>

        {/* Unified Card with Tab Switcher */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          {/* Segmented Control */}
          <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800/80">
            <button
              id="tab-select-kasir"
              type="button"
              onClick={() => {
                setActiveRole('kasir');
                setAdminError('');
              }}
              className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeRole === 'kasir'
                  ? 'text-zinc-950 font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeRole === 'kasir' && (
                <motion.div
                  layoutId="activeRolePill"
                  className="absolute inset-0 bg-amber-400 rounded-xl -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Coffee className="w-4 h-4" />
              <span>Kasir POS</span>
            </button>

            <button
              id="tab-select-admin"
              type="button"
              onClick={() => {
                setActiveRole('admin');
                setAdminError('');
              }}
              className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeRole === 'admin'
                  ? 'text-zinc-950 font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {activeRole === 'admin' && (
                <motion.div
                  layoutId="activeRolePill"
                  className="absolute inset-0 bg-white rounded-xl -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <ShieldCheck className="w-4 h-4" />
              <span>Owner / Admin</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <AnimatePresence mode="wait">
            {activeRole === 'kasir' ? (
              <motion.div
                key="form-kasir"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Single Worker Card: BIMA */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                      B
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">BIMA</h4>
                      <p className="text-[11px] text-zinc-400">Kasir Operasional Bertugas</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                </div>

                <Button
                  id="btn-login-as-cashier"
                  type="button"
                  onClick={handleStartKasirShift}
                  className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs gap-2 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-[0.99]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Absen Masuk (Selfie) & Mulai Shift</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form-admin"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleAdminLogin}
                className="space-y-4"
              >
                {adminError && (
                  <div className="p-2.5 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300">
                      PIN Owner (PRIMA):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminPin('0808');
                        setAdminError('');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      PIN Demo: 0808
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <Input
                      id="input-login-admin-pin"
                      type="password"
                      maxLength={6}
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setAdminError('');
                      }}
                      placeholder="Masukkan 4 digit PIN"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-10 pl-10 text-center font-sans tracking-widest text-sm rounded-xl focus:border-white"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <Button
                  id="btn-login-as-admin"
                  type="submit"
                  className="w-full h-11 bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs gap-2 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-[0.99]"
                >
                  <span>Buka Dashboard PRIMA</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mandatory Selfie Attendance Clock-In Modal for BIMA */}
      <WorkerClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        workerUser={getKasirUser()}
        settings={settings}
        onClockInSuccess={handleClockInSuccess}
      />
    </div>
  );
};
