import { cva } from "class-variance-authority";
import { forwardRef } from "react";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction: "row" | "column";
  reverse?: boolean;
  children?: React.ReactNode;
}

const Stack = (
  {
    direction,
    reverse = false,
    className = "",
    children,
    ...props
  }: StackProps,
  ref: React.Ref<HTMLDivElement>,
) => {
  return (
    <div
      ref={ref}
      className={stackVariants({ direction, reverse, className })}
      {...props}
    >
      {children}
    </div>
  );
};

const stackVariants = cva("flex items-center", {
  variants: {
    direction: {
      row: null,
      column: null,
    },
    reverse: {
      true: null,
      false: null,
    },
  },
  compoundVariants: [
    {
      direction: "row",
      reverse: false,
      className: "flex-row",
    },
    {
      direction: "row",
      reverse: true,
      className: "flex-row-reverse",
    },
    {
      direction: "column",
      reverse: false,
      className: "flex-col",
    },
    {
      direction: "column",
      reverse: true,
      className: "flex-col-reverse",
    },
  ],
});

export default forwardRef<HTMLDivElement, StackProps>(Stack);
