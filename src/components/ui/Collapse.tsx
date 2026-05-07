import { cva } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

const Collapse = ({ isOpen, children, className = "" }: CollapseProps) => {
  const [height, setHeight] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      setHeight(element.scrollHeight);
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div
      style={{
        height: isOpen ? (height ?? "auto") : 0,
      }}
      className={collpaseVariants({ className })}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};

const collpaseVariants = cva("overflow-y-hidden transition-all", {
  variants: {
    isOpen: {
      true: "opacity-100",
      false: "opacity-0",
    },
  },
});

export default Collapse;
