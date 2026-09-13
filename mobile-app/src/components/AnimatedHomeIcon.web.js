import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

const DEFAULT_TRANSITION = {
  duration: 0.6,
  opacity: { duration: 0.2 },
};

const PATH_VARIANTS = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
  },
};

/**
 * AnimatedHomeIcon (Web)
 * Uses framer-motion for authentic pathLength and opacity door drawing animation.
 */
export const AnimatedHomeIcon = forwardRef(function AnimatedHomeIcon(
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
  const controls = useAnimation();
  const bounceControls = useAnimation();
  const isControlledRef = useRef(false);

  const startAnimation = useCallback(async () => {
    try {
      // 1. Subtle tactile bounce on house icon
      bounceControls.start({
        scale: [1, 0.85, 1.08, 1],
        transition: { duration: 0.45, ease: 'easeOut' },
      });

      // 2. Door stroke draw animation: reset to 0 then animate to 1
      await controls.set({ opacity: 0, pathLength: 0 });
      controls.start({
        opacity: 1,
        pathLength: 1,
        transition: {
          duration: 0.6,
          opacity: { duration: 0.2 },
          ease: [0.16, 1, 0.3, 1],
        },
      });
    } catch (err) {
      // Ignore if unmounted during animation
    }
  }, [controls, bounceControls]);

  const stopAnimation = useCallback(() => {
    controls.start('normal');
  }, [controls]);

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

  // Trigger animation whenever trigger changes or when active becomes true
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
        animate={bounceControls}
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
        {/* House Outline */}
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        
        {/* Animated Door */}
        <motion.path
          animate={controls}
          initial={{ opacity: 1, pathLength: 1 }}
          d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
          transition={DEFAULT_TRANSITION}
          variants={PATH_VARIANTS}
        />
      </motion.svg>
    </div>
  );
});

export default AnimatedHomeIcon;

