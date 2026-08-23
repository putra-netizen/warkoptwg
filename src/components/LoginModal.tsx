import React, { useState } from 'react';
import { User, UserRole, AppSettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { 
  Lock, 
  UserCheck, 
  Coffee, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  settings: AppSettings;
  users: User[];
  requireAdminPin?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  settings,
  users,
  requireAdminPin = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('kasir');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (role: UserRole) => {
    setError('');
    const targetUser = users.find(u => u.role === role) || {
      id: role === 'admin' ? 'u-2' : 'u-1',
      username: role,
      role: role,
      nama: role === 'admin' ? 'PRIMA' : 'BIMA',
      status: 'aktif',
    };

    if (role === 'admin' && requireAdminPin) {
      setSelectedRole('admin');
      // Prompt for PIN
      return;
    }

    onLoginSuccess(targetUser);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'admin') {
      if (pin !== settings.admin_pin && pin !== '0808') {
        setError('PIN Admin salah! (Default PIN: 0808)');
        return;
      }
      const adminUser = users.find(u => u.role === 'admin') || {
        id: 'u-2',
        username: username || 'prima',
        role: 'admin',
        nama: username ? `${username} (Admin)` : 'PRIMA',
        status: 'aktif',
      };
      onLoginSuccess(adminUser);
    } else {
      const kasirUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === 'kasir') || {
        id: 'u-1',
        username: username || 'bima',
        role: 'kasir',
        nama: username ? `${username} (Kasir)` : 'BIMA',
        status: 'aktif',
      };
      onLoginSuccess(kasirUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-card border rounded-xl shadow-lg overflow-hidden my-auto"
      >
        {/* Top Header with Brand */}
        <div className="p-6 text-center border-b flex flex-col items-center">
          <BrandLogo size="lg" showSubtitle={false} className="mb-2" />
          <h2 className="font-bold text-xl tracking-tight text-foreground">
            WARKOP TWG
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sistem Kasir POS & Manajemen Warkop
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-2 bg-muted/40 gap-2 border-b">
          <Button
            type="button"
            variant={selectedRole === 'kasir' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setSelectedRole('kasir'); setError(''); }}
            className="gap-2 text-xs font-medium h-9"
          >
            <Coffee className="w-4 h-4" />
            <span>Mode Kasir (POS)</span>
          </Button>

          <Button
            type="button"
            variant={selectedRole === 'admin' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setSelectedRole('admin'); setError(''); }}
            className="gap-2 text-xs font-medium h-9"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mode Admin / Owner</span>
          </Button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Access for Instant testing */}
          <div className="bg-muted/30 p-3.5 rounded-lg border space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Akses Cepat Pengujian:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                id="btn-quick-login-kasir"
                onClick={() => handleQuickLogin('kasir')}
                className="text-xs font-medium gap-1.5 h-8"
              >
                <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Masuk Kasir</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                id="btn-quick-login-admin"
                onClick={() => {
                  setSelectedRole('admin');
                  setPin('0808');
                }}
                className="text-xs font-medium gap-1.5 h-8"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Isi PIN (0808)</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
            {selectedRole === 'kasir' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Nama / Username Kasir
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="input-login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: BIMA"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground block">
                    PIN Akses Admin
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Default PIN: 0808
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="input-login-admin-pin"
                    type="password"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masukkan 4 digit PIN (0808)"
                    className="pl-9 font-mono tracking-widest text-sm"
                  />
                </div>
              </div>
            )}

            <Button
              id="btn-submit-login"
              type="submit"
              size="lg"
              className="w-full text-xs font-semibold gap-2 mt-2"
            >
              <span>{selectedRole === 'admin' ? 'Buka Dashboard Admin' : 'Mulai Mesin Kasir'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export const AdminPinPromptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}> = ({ isOpen, onClose, onSuccess, correctPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin || pin === '0808') {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('PIN salah! Default PIN: 0808');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xs bg-card border rounded-xl shadow-lg p-6 space-y-4"
      >
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center mx-auto mb-3 border">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground">
            Verifikasi PIN Admin
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Area khusus manajemen (PIN: <strong>0808</strong>)
          </p>
        </div>

        {error && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            autoFocus
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="text-center font-mono tracking-[0.4em] text-xl font-bold"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-semibold"
            >
              Verifikasi
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

