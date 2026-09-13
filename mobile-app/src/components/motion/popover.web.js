"use client";
// beui.dev/components/motion/popover (Web)
// Spring-based liquid morph popover matching beui.dev design specifications.

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  isValidElement,
  cloneElement,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Authentic beui.dev spring physics
export const GOO_OPEN_SPRING = {
  type: 'spring',
  damping: 14,
  stiffness: 220,
  mass: 0.55,
};

export const GOO_CLOSE_SPRING = {
  duration: 0.2,
  ease: [0.32, 0, 0.67, 0],
};

const PopoverContext = createContext(null);

export function usePopoverContext(component = 'PopoverContext') {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error(`${component} must be used within <Popover>`);
  return ctx;
}

export function Popover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger = 'click',
  side = 'bottom',
  align = 'end',
  sideOffset = 10,
  panelRadius = 22,
  gooStrength = 8,
  popoverBg,
  className,
}) {
  const gooId = useMemo(() => `goo-${Math.random().toString(36).substring(2, 9)}`, []);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  // Escape key light-dismissal
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const ctx = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      triggerMode: trigger,
      side,
      align,
      sideOffset,
      panelRadius,
      gooStrength,
      popoverBg,
      gooId,
      rootRef,
      triggerRef,
    }),
    [
      open,
      setOpen,
      toggle,
      trigger,
      side,
      align,
      sideOffset,
      panelRadius,
      gooStrength,
      popoverBg,
      gooId,
    ]
  );

  return (
    <PopoverContext.Provider value={ctx}>
      <div
        ref={rootRef}
        style={{
          position: 'relative',
          display: 'inline-flex',
          zIndex: open ? 9990 : 1,
        }}
        className={className}
      >
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }) {
  const ctx = usePopoverContext('PopoverTrigger');

  if (!isValidElement(children)) return children;

  const child = children;
  const originalOnPress = child.props.onPress || child.props.onClick;

  return cloneElement(child, {
    ref: (node) => {
      ctx.triggerRef.current = node;
      if (typeof child.ref === 'function') child.ref(node);
      else if (child.ref && typeof child.ref === 'object') child.ref.current = node;
    },
    onClick: (e) => {
      originalOnPress?.(e);
      ctx.toggle();
    },
    onPress: (e) => {
      originalOnPress?.(e);
      ctx.toggle();
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': ctx.open,
    'data-state': ctx.open ? 'open' : 'closed',
  });
}

export function PopoverContent({ children, style, popoverBg: propBg }) {
  const ctx = usePopoverContext('PopoverContent');
  const {
    open,
    setOpen,
    side,
    align,
    sideOffset,
    panelRadius,
    gooStrength,
    gooId,
    popoverBg: ctxBg,
  } = ctx;

  const bg = propBg || ctxBg || '#ffffff';

  // Compute position relative to the trigger container
  const positionStyle = useMemo(() => {
    const pos = {
      position: 'absolute',
      zIndex: 9999,
    };

    if (side === 'bottom') {
      pos.top = `calc(100% + ${sideOffset}px)`;
    } else {
      pos.bottom = `calc(100% + ${sideOffset}px)`;
    }

    if (align === 'end') {
      pos.right = 0;
      pos.transformOrigin = 'top right';
    } else if (align === 'start') {
      pos.left = 0;
      pos.transformOrigin = 'top left';
    } else {
      pos.left = '50%';
      pos.transformOrigin = 'top center';
    }

    return pos;
  }, [side, align, sideOffset]);

  return (
    <>
      {/* SVG Liquid Goo Filter Definition */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <filter id={gooId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={gooStrength} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <AnimatePresence>
        {open && (
          <>
            {/* Fixed Light-Dismiss Backdrop */}
            <motion.div
              key="popover-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                zIndex: 9995,
              }}
            />

            {/* Liquid Morph Popover Panel */}
            <motion.div
              key="popover-panel"
              role="dialog"
              aria-modal="true"
              initial={{
                opacity: 0,
                scale: 0.82,
                y: side === 'bottom' ? -18 : 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.86,
                y: side === 'bottom' ? -12 : 12,
                transition: GOO_CLOSE_SPRING,
              }}
              transition={GOO_OPEN_SPRING}
              style={{
                ...positionStyle,
                borderRadius: panelRadius,
                backgroundColor: bg,
              }}
            >
              {/* Organic Liquid Connector Neck */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: side === 'bottom' ? -9 : undefined,
                  bottom: side === 'top' ? -9 : undefined,
                  right: align === 'end' ? 14 : undefined,
                  left: align === 'start' ? 14 : undefined,
                  width: 32,
                  height: 10,
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <svg width="32" height="10" viewBox="0 0 32 10" fill="none">
                  <path
                    d="M4 10 C4 5, 10 1, 16 1 C22 1, 28 5, 28 10 Z"
                    fill={bg}
                  />
                </svg>
              </div>

              {/* Popover Content */}
              <div style={{ position: 'relative', zIndex: 3, ...style }}>
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Popover;
