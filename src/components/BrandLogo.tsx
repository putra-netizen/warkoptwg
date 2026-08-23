import React, { useState } from 'react';
import { Coffee } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero' | 'receipt';
  className?: string;
  forceSvgFallback?: boolean;
  monochrome?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className = '',
  forceSvgFallback = false,
  monochrome = false,
}) => {
  const [imgError, setImgError] = useState(forceSvgFallback);

  // Direct Google Drive embed URL
  const gDriveDirectUrl = "https://lh3.googleusercontent.com/d/1r2FALNajvsbE5CHp2ObY5fhdfAVMx7ti";

  const sizeClasses = {
    receipt: 'h-10 w-auto',
    sm: 'h-7 w-auto',
    md: 'h-8 sm:h-9 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
    '2xl': 'h-20 w-auto',
    hero: 'h-20 sm:h-24 w-auto',
  };

  const iconSizes = {
    receipt: 'h-6 w-6',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
    hero: 'h-12 w-12',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {!imgError && !forceSvgFallback ? (
        <img
          src={gDriveDirectUrl}
          alt="TWG Logo"
          className={`${sizeClasses[size]} object-contain rounded-md select-none ${
            monochrome ? 'grayscale contrast-200 brightness-90 filter' : ''
          }`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`flex items-center justify-center rounded-lg ${monochrome ? 'bg-black text-white' : 'bg-zinc-900 text-white'} p-2 shadow-xs`}>
          <Coffee className={iconSizes[size]} />
        </div>
      )}
    </div>
  );
};
