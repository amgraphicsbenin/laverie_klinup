import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * AnimatedHistoryIcon (Web)
 * Animated History / Clock icon for the Historique tab in the navigation bar.
 * Replicates time rewind: clock hands spin full 360° with arrow counter-rotation & bounce.
 */
export const AnimatedHistoryIcon = forwardRef(function AnimatedHistoryIcon(
  {
    onMouseEnter,
    onMouseLeave,
    className,
    size = 24,
    color = '#002cf7',
    active = false,
    trigger = 0,
    style,
    ...props
  },
  ref
) {
  const containerControls = useAnimation();
  const handsControls = useAnimation();
  const isControlledRef = useRef(false);

  const startAnimation = useCallback(async () => {
    try {
      // 1. Tactile bounce & arrow recoil
      containerControls.start({
        scale: [1, 0.88, 1.1, 1],
        rotate: [0, -25, 0],
        transition: { duration: 0.55, ease: 'easeOut' },
      });

      // 2. Clock hands spin full 360° clockwise
      await handsControls.set({ rotate: 0 });
      handsControls.start({
        rotate: 360,
        transition: {
          duration: 0.65,
          ease: [0.16, 1, 0.3, 1],
        },
      });
    } catch (e) {}
  }, [containerControls, handsControls]);

  const stopAnimation = useCallback(() => {
    containerControls.start({ scale: 1, rotate: 0 });
    handsControls.start({ rotate: 0 });
  }, [containerControls, handsControls]);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation,
      stopAnimation,
    };
  });

  const handleMouseEnter = useCallback(
    (e) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        startAnimation();
      }
    },
    [onMouseEnter, startAnimation]
  );

  const handleMouseLeave = useCallback(
    (e) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        stopAnimation();
      }
    },
    [onMouseLeave, stopAnimation]
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (active || trigger > 0) {
      startAnimation();
    }
  }, [active, trigger, startAnimation]);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
      {...props}
    >
      <motion.svg
        animate={containerControls}
        fill="none"
        height={size}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          transformOrigin: 'center center',
        }}
      >
        {/* Counter-clockwise Circular Arrow */}
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />

        {/* Clock Hands Spinning around center (12, 12) */}
        <motion.g
          animate={handsControls}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="M12 7v5" />
          <path d="M12 12l3 2" />
        </motion.g>
      </motion.svg>
    </div>
  );
});

export default AnimatedHistoryIcon;

