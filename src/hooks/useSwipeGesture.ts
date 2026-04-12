import { useRef, useCallback, useEffect } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  edgeWidth?: number;
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight, threshold = 50, edgeWidth = 30 }: UseSwipeOptions
) {
  const touchStart = useRef<{ x: number; y: number; time: number; fromEdge: boolean } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const fromEdge = touch.clientX <= edgeWidth || touch.clientX >= window.innerWidth - edgeWidth;
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), fromEdge };
  }, [edgeWidth]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const elapsed = Date.now() - touchStart.current.time;

    // Only count horizontal swipes (not vertical scrolls) within 500ms
    if (Math.abs(dx) > threshold && Math.abs(dy) < Math.abs(dx) * 0.75 && elapsed < 500) {
      if (dx > 0 && (touchStart.current.fromEdge || onSwipeRight)) {
        onSwipeRight?.();
      } else if (dx < 0) {
        onSwipeLeft?.();
      }
    }
    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, handleTouchStart, handleTouchEnd]);
}
