import { cva } from "class-variance-authority";

import { range } from "@/utils/array";

interface SkeletonTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  length?: number;
}

const SkeletonText = ({
  length,
  className = "",
  children,
}: SkeletonTextProps) => {
  return (
    <p
      style={{ color: "transparent" }}
      className={skeletonTextVariants({ className })}
    >
      {length != null
        ? range(length)
            .map((n) => n % 10)
            .join("")
        : children}
    </p>
  );
};

const skeletonTextVariants = cva("animate-pulse rounded-md bg-slate-200");

export default SkeletonText;
