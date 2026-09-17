import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseFloatingPortalOptions {
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right' | 'auto';
  minWidth?: number;
  matchWidth?: boolean;
  offset?: number;
  expectedHeight?: number;
}

export interface FloatingCoords {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width?: number;
  minWidth?: number;
  maxHeight: number;
  isUp: boolean;
}

export function useFloatingPortal({
  isOpen,
  onClose,
  align = 'auto',
  minWidth = 160,
  matchWidth = false,
  offset = 6,
  expectedHeight = 240,
}: UseFloatingPortalOptions) {
  const triggerRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<FloatingCoords | null>(null);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = (triggerRef.current as HTMLElement).getBoundingClientRect();

    // If trigger element has scrolled completely off screen, close popover
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      onClose();
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const isUp = spaceBelow < expectedHeight && spaceAbove > spaceBelow;

    const width = matchWidth ? rect.width : Math.max(rect.width, minWidth);

    let isRight = align === 'right';
    if (align === 'auto') {
      isRight = rect.left + width > window.innerWidth - 12;
    }

    setCoords({
      top: isUp ? undefined : rect.bottom + offset,
      bottom: isUp ? window.innerHeight - rect.top + offset : undefined,
      left: isRight ? undefined : Math.max(8, rect.left),
      right: isRight ? Math.max(8, window.innerWidth - rect.right) : undefined,
      width: matchWidth ? rect.width : rect.width > minWidth ? rect.width : undefined,
      minWidth,
      maxHeight: Math.min(expectedHeight, Math.max(120, (isUp ? spaceAbove : spaceBelow) - 16)),
      isUp,
    });
  }, [onClose, align, minWidth, matchWidth, offset, expectedHeight]);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !(triggerRef.current as HTMLElement).contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return {
    triggerRef,
    menuRef,
    coords,
  };
}

