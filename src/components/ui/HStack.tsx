import { forwardRef } from "react";

import Stack from "./Stack";

interface HStackProps extends React.HTMLAttributes<HTMLDivElement> {
  reverse?: boolean;
  children?: React.ReactNode;
}

const HStack = (
  { reverse = false, className = "", children, ...props }: HStackProps,
  ref: React.Ref<HTMLDivElement>,
) => {
  return (
    <Stack
      ref={ref}
      className={className}
      direction="row"
      reverse={reverse}
      {...props}
    >
      {children}
    </Stack>
  );
};

export default forwardRef<HTMLDivElement, HStackProps>(HStack);
