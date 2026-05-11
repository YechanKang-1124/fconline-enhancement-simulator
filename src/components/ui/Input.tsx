import { cva } from "class-variance-authority";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = (
  { invalid = false, className = "", ...props }: InputProps,
  ref: React.Ref<HTMLInputElement>,
) => {
  return (
    <input
      ref={ref}
      aria-invalid={invalid}
      className={inputFormVariants({ invalid, className })}
      {...props}
    />
  );
};

const inputFormVariants = cva(
  "w-full rounded-xl border bg-white px-3 py-1 text-base font-light enabled:hover:border-blue-300 enabled:hover:outline enabled:hover:outline-blue-300 enabled:focus:border-blue-500 enabled:focus:outline enabled:focus:outline-blue-500 disabled:bg-gray-100 disabled:text-gray-600",
  {
    variants: {
      invalid: {
        true: "border-red-500 outline outline-red-500 enabled:hover:border-red-500 enabled:hover:outline-red-500 enabled:focus:border-red-500 enabled:focus:outline-red-500",
        false: "border-gray-200",
      },
    },
  },
);

export default forwardRef<HTMLInputElement, InputProps>(Input);
