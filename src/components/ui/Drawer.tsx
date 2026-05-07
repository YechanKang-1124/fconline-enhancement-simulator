import { cva } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { MouseEvent } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
}

const Drawer = ({
  isOpen,
  onClose,
  className = "",
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnEsc = true,
  closeOnOverlayClick = true,
  initialFocusRef,
  children,
}: DrawerProps) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return;
    }
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setIsMounted(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [isOpen, isMounted]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;

    const dialogElement = dialogRef.current;
    const focusableElements =
      dialogElement == null ? [] : getFocusableElements(dialogElement);
    const nextFocusTarget =
      initialFocusRef?.current ?? focusableElements[0] ?? dialogElement;

    requestAnimationFrame(() => {
      nextFocusTarget?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEsc) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || dialogRef.current == null) {
        return;
      }

      const currentFocusableElements = getFocusableElements(dialogRef.current);

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          activeElement === dialogRef.current
        ) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [closeOnEsc, initialFocusRef, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [isOpen]);

  if (!isMounted || typeof window === "undefined") {
    return null;
  }

  const modalRoot = document.getElementById("modal-root") || document.body;

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const stopDrawerEvent = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const stopDrawerPointerDown = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex"
      onClick={stopDrawerEvent}
      onMouseDown={stopDrawerPointerDown}
    >
      <div
        className={overlayVariants({ isVisible })}
        onClick={handleOverlayClick}
        onMouseDown={stopDrawerPointerDown}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={drawerContentVariants({ isVisible, className })}
        onClick={stopDrawerEvent}
        onMouseDown={stopDrawerPointerDown}
      >
        {children}
      </div>
    </div>,
    modalRoot,
  );
};

const overlayVariants = cva(
  "absolute inset-0 bg-black transition-opacity ease-in-out",
  {
    variants: {
      isVisible: {
        true: "opacity-50 duration-300",
        false: "opacity-0 duration-150",
      },
    },
  },
);

const drawerContentVariants = cva(
  "z-10 ms-auto h-full transition-transform ease-in-out",
  {
    variants: {
      isVisible: {
        true: "translate-x-0 duration-300",
        false: "duration-150 ltr:translate-x-full rtl:-translate-x-full",
      },
    },
  },
);

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter((element) => {
    return (
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.tabIndex !== -1
    );
  });
}

export default Drawer;
