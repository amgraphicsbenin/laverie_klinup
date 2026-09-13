import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * AnimatedAddIcon (Web)
 * Animated Plus in Circle icon for the Ajouter tab in the navigation bar.
 * Replicates cross rotation (90° spin) with elastic bounce and path drawing.
 */
export const AnimatedAddIcon = forwardRef(function AnimatedAddIcon(
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
  const circleControls = useAnimation();
  const crossControls = useAnimation();
  const isControlledRef = useRef(false);

  const startAnimation = useCallback(async () => {
    try {
      // 1. Tactile bounce on outer circle
      circleControls.start({
        scale: [1, 0.86, 1.14, 1],
        transition: { duration: 0.45, ease: 'easeOut' },
      });

      // 2. 90deg elastic spin and redraw on plus cross
      await crossControls.set({ rotate: 0, scale: 0.8, opacity: 0.7 });
      crossControls.start({
        rotate: 90,
        scale: 1,
        opacity: 1,
        transition: {
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        },
      });
    } catch (e) {}
  }, [circleControls, crossControls]);

  const stopAnimation = useCallback(() => {
    crossControls.start({ rotate: 0, scale: 1 });
    circleControls.start({ scale: 1 });
  }, [crossControls, circleControls]);

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
        animate={circleControls}
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
        {/* Outer Circle */}
        <circle cx="12" cy="12" r="10" />

        {/* Plus Cross (Rotates and scales) */}
        <motion.g
          animate={crossControls}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </motion.g>
      </motion.svg>
    </div>
  );
});

export default AnimatedAddIcon;

