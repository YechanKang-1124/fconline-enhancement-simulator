import { forwardRef } from "react";

import Stack from "./Stack";

interface VStackProps extends React.HTMLAttributes<HTMLDivElement> {
  reverse?: boolean;
  children?: React.ReactNode;
}

const VStack = (
  { reverse = false, className = "", children, ...props }: VStackProps,
  ref: React.Ref<HTMLDivElement>,
) => {
  return (
    <Stack
      ref={ref}
      className={className}
      direction="column"
      reverse={reverse}
      {...props}
    >
      {children}
    </Stack>
  );
};

export default forwardRef<HTMLDivElement, VStackProps>(VStack);
