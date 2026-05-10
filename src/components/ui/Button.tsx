import { cva } from "class-variance-authority";

import Spinner from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "white" | "blue" | "green" | "gray";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = ({
  disabled = false,
  color = "blue",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  const isLoading = loading && !disabled;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={buttonVariants({
        color,
        size,
        disabled,
        isLoading,
        className,
      })}
      {...props}
    >
      <span className={contentVariants({ isLoading })}>
        {leftIcon != null && <span className={iconVariants()}>{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon != null && (
          <span className={iconVariants()}>{rightIcon}</span>
        )}
      </span>
      {isLoading && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Spinner
            aria-hidden="true"
            size={size}
            className={spinnerVariants({ color })}
          />
        </span>
      )}
    </button>
  );
};

const buttonVariants = cva(
  "relative inline-flex items-center justify-center border transition-colors transition-opacity duration-300 focus:outline-none disabled:pointer-events-none",
  {
    variants: {
      color: {
        white: null,
        blue: null,
        green: null,
        gray: null,
      },
      size: {
        sm: "rounded-md px-1.5 py-1 text-xs",
        md: "rounded-lg px-3 py-2 text-sm",
        lg: "rounded-xl px-4.5 py-3 text-lg font-semibold",
      },
      disabled: {
        true: "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400",
        false: "cursor-pointer",
      },
      isLoading: {
        true: "opacity-60",
        false: null,
      },
    },
    compoundVariants: [
      {
        color: "white",
        disabled: false,
        className:
          "border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-600",
      },
      {
        color: "blue",
        disabled: false,
        className:
          "border-blue-500 bg-blue-500 text-white hover:border-blue-600 hover:bg-blue-600",
      },
      {
        color: "green",
        disabled: false,
        className:
          "border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700",
      },
      {
        color: "gray",
        disabled: false,
        className:
          "border-gray-700 bg-gray-700 text-white hover:border-gray-600 hover:bg-gray-600",
      },
    ],
    defaultVariants: {
      color: "blue",
      size: "md",
    },
  },
);

const contentVariants = cva("inline-flex items-center justify-center gap-2", {
  variants: {
    isLoading: {
      true: "opacity-0",
      false: null,
    },
  },
});

const iconVariants = cva("inline-flex shrink-0 items-center justify-center");

const spinnerVariants = cva(null, {
  variants: {
    color: {
      white: "text-gray-600",
      blue: "text-white",
      green: "text-white",
      gray: "text-white",
    },
  },
});

export default Button;
