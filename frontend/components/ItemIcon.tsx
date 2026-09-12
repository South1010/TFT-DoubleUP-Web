'use client';

import React, { useState } from 'react';
import { getItem, getItemIcon, getItemName } from '../utils/setMaster';

interface ItemIconProps {
  id?: string;
  name?: string;
  icon?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function ItemIcon({ id, name, icon, size = 'md' }: ItemIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Look up master item data if icon/name is missing or ID is provided
  const masterItem = getItem(id || name || '');
  const rawName = name || masterItem.name || id || '装備アイテム';
  const displayName = rawName.startsWith('TFT_Item_') || rawName.startsWith('TFT18_Item_') || rawName.startsWith('TFT_')
    ? (getItemName(rawName) || masterItem.name || '装備アイテム')
    : (getItemName(rawName) || masterItem.name || '装備アイテム');
  const resolvedIcon = getItemIcon(id || name || '');
  
  // Prefer resolvedIcon from our master dictionary if available
  const primaryIcon = resolvedIcon || icon || masterItem.icon;
  const [currentSrc, setCurrentSrc] = useState<string>(primaryIcon);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);

  React.useEffect(() => {
    const nextIcon = resolvedIcon || icon || masterItem.icon;
    setCurrentSrc(nextIcon);
    setImgError(false);
    setTriedFallback(false);
  }, [id, name, icon]);

  const handleImgError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      const isEmblem = displayName.includes('紋章') || rawName.toLowerCase().includes('emblem');
      if (currentSrc !== resolvedIcon && resolvedIcon && resolvedIcon !== currentSrc) {
        setCurrentSrc(resolvedIcon);
      } else if (isEmblem && currentSrc !== 'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_spatula.png') {
        setCurrentSrc('https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_spatula.png');
      } else {
        setImgError(true);
      }
    } else {
      setImgError(true);
    }
  };

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-[26px] h-[26px]',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const isEmblem = displayName.includes('紋章') || rawName.toLowerCase().includes('emblem');

  const frameClass = isEmblem
    ? 'border-purple-500/90 bg-purple-950/90 shadow-[0_0_8px_rgba(168,85,247,0.35)] hover:border-purple-300'
    : 'border-slate-700/80 bg-slate-950 hover:border-amber-400';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`relative rounded-md overflow-hidden border p-[1px] shadow-sm transition-colors ${frameClass} ${sizeClasses[size]}`}>
        {currentSrc && !imgError ? (
          <img
            src={currentSrc}
            alt={displayName}
            className="w-full h-full object-cover rounded-[4px]"
            onError={handleImgError}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-[9px] font-extrabold border rounded-[4px] px-0.5 text-center leading-tight ${
            isEmblem
              ? 'bg-purple-900/90 text-purple-200 border-purple-400/50'
              : 'bg-slate-800/90 text-amber-300/90 border-amber-500/20'
          }`}>
            {displayName.substring(0, 2)}
          </div>
        )}
      </div>

      {/* Interactive Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg glass-panel bg-slate-900/95 border border-amber-500/30 text-xs text-slate-100 whitespace-nowrap shadow-xl pointer-events-none animate-fadeIn">
          <div className="font-bold text-amber-300">{displayName}</div>
          {masterItem.desc && (
            <div className="text-[10px] text-slate-400 max-w-[200px] whitespace-normal line-clamp-2 mt-0.5">
              {masterItem.desc}
            </div>
          )}
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
