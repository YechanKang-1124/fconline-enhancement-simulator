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
  "w-full rounded-xl border bg-white px-3 py-2.5 text-base font-light hover:border-blue-300 hover:outline hover:outline-blue-300 focus:border-blue-500 focus:outline focus:outline-blue-500",
  {
    variants: {
      invalid: {
        true: "border-red-500 outline outline-red-500 hover:border-red-500 hover:outline-red-500 focus:border-red-500 focus:outline-red-500",
        false: "border-gray-200",
      },
    },
  },
);

export default forwardRef<HTMLInputElement, InputProps>(Input);
