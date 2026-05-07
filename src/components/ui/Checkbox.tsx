import { cva } from "class-variance-authority";

import { IconCheck } from "@/assets/icons";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const Checkbox = ({ className = "", ...props }: CheckboxProps) => {
  return (
    <div className="relative inline-flex size-[18px] shrink-0">
      <input
        type="checkbox"
        className={checkboxVariants({ className })}
        {...props}
      />
      <span className={iconWrapperVariants()}>
        <IconCheck className="size-[14px]" />
      </span>
    </div>
  );
};

const checkboxVariants = cva(
  "peer size-[18px] cursor-pointer appearance-none rounded-sm border-[1.5px] border-gray-400 bg-white transition checked:border-blue-500 checked:bg-blue-500 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 hover:[&:not(:checked):not(:disabled)]:border-blue-500 hover:[&:not(:checked):not(:disabled)]:bg-blue-100",
);

const iconWrapperVariants = cva(
  "pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 transition peer-checked:opacity-100 peer-disabled:hidden",
);

export default Checkbox;
