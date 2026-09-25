import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "outline" | "danger" | "success" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className = "",
    variant = "primary",
    size = "md",
    style,
    disabled,
    children,
    whileHover,
    whileTap,
    ...props
  },
  ref
) {
  let variantClass = "btn-primary";
  if (variant === "outline") variantClass = "btn-outline";
  else if (variant === "danger") variantClass = "btn-danger";
  else if (variant === "secondary") variantClass = "btn-secondary";
  else if (variant === "ghost") variantClass = "btn-ghost";

  const sizeStyles =
    size === "sm"
      ? { padding: "0.35rem 0.75rem", fontSize: "0.74rem" }
      : size === "lg"
      ? { padding: "0.75rem 1.6rem", fontSize: "0.92rem" }
      : {};

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={`btn ${variantClass} ${className}`.trim()}
      style={{
        ...sizeStyles,
        ...style,
      }}
      whileHover={disabled ? undefined : (whileHover !== undefined ? whileHover : { filter: "brightness(1.04)" })}
      whileTap={disabled ? undefined : (whileTap !== undefined ? whileTap : { scale: 0.97 })}
      transition={{ duration: 0.12 }}
      {...props}
    >
      {children}
    </motion.button>
  );
});
