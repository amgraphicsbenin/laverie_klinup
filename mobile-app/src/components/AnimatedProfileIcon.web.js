import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * AnimatedProfileIcon (Web)
 * Animated User / Avatar icon for the Profil tab in the navigation bar.
 * Replicates friendly avatar nod & breath with tactile bounce.
 */
export const AnimatedProfileIcon = forwardRef(function AnimatedProfileIcon(
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
  const headControls = useAnimation();
  const bodyControls = useAnimation();
  const isControlledRef = useRef(false);

  const startAnimation = useCallback(async () => {
    try {
      // 1. Tactile bounce on entire avatar
      containerControls.start({
        scale: [1, 0.88, 1.1, 1],
        transition: { duration: 0.45, ease: 'easeOut' },
      });

      // 2. Playful friendly nod on the head
      headControls.start({
        y: [0, -3.5, 1, 0],
        transition: {
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1],
        },
      });

      // 3. Subtle breathing scale on shoulders/body
      bodyControls.start({
        scale: [1, 1.05, 0.98, 1],
        transition: {
          duration: 0.55,
          ease: 'easeInOut',
        },
      });
    } catch (e) {}
  }, [containerControls, headControls, bodyControls]);

  const stopAnimation = useCallback(() => {
    containerControls.start({ scale: 1 });
    headControls.start({ y: 0 });
    bodyControls.start({ scale: 1 });
  }, [containerControls, headControls, bodyControls]);

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
        {/* Nodding Head */}
        <motion.circle
          animate={headControls}
          cx="12"
          cy="8"
          r="5"
          style={{ transformOrigin: '12px 8px' }}
        />

        {/* Breathing Shoulders / Body */}
        <motion.path
          animate={bodyControls}
          d="M20 21a8 8 0 0 0-16 0"
          style={{ transformOrigin: '12px 21px' }}
        />
      </motion.svg>
    </div>
  );
});

export default AnimatedProfileIcon;

