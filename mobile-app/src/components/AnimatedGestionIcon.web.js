import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * AnimatedGestionIcon (Web)
 * Animated FileText icon for the Gestion tab in the bottom navigation bar.
 * Replicates sequential stroke drawing on document lines [1, 0, 1] with tactile bounce.
 */
export const AnimatedGestionIcon = forwardRef(function AnimatedGestionIcon(
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
  const isControlledRef = useRef(false);

  const startAnimation = useCallback(async () => {
    try {
      await controls.set('normal');
      controls.start('animate');
    } catch (e) {
      // ignore if unmounted
    }
  }, [controls]);

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

  // Trigger animation whenever trigger changes or when tab becomes active
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
        animate={controls}
        fill="none"
        height={size}
        initial="normal"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        variants={{
          normal: { scale: 1 },
          animate: {
            scale: [1, 0.88, 1.08, 1],
            transition: {
              duration: 0.45,
              ease: 'easeOut',
            },
          },
        }}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          transformOrigin: 'center center',
        }}
      >
        {/* Document Outline */}
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        
        {/* Folded Corner */}
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />

        {/* Text Line 1 */}
        <motion.path
          d="M10 9H8"
          stroke={color}
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              opacity: 1,
            },
            animate: {
              pathLength: [1, 0, 1],
              opacity: [1, 0.4, 1],
              transition: {
                duration: 0.55,
                delay: 0.1,
                ease: 'easeInOut',
              },
            },
          }}
        />

        {/* Text Line 2 */}
        <motion.path
          d="M16 13H8"
          stroke={color}
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              opacity: 1,
            },
            animate: {
              pathLength: [1, 0, 1],
              opacity: [1, 0.4, 1],
              transition: {
                duration: 0.55,
                delay: 0.25,
                ease: 'easeInOut',
              },
            },
          }}
        />

        {/* Text Line 3 */}
        <motion.path
          d="M16 17H8"
          stroke={color}
          strokeWidth="2"
          variants={{
            normal: {
              pathLength: 1,
              opacity: 1,
            },
            animate: {
              pathLength: [1, 0, 1],
              opacity: [1, 0.4, 1],
              transition: {
                duration: 0.55,
                delay: 0.4,
                ease: 'easeInOut',
              },
            },
          }}
        />
      </motion.svg>
    </div>
  );
});

export default AnimatedGestionIcon;

