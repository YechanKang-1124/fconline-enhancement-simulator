import { cva } from "class-variance-authority";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { BaseModalProps } from "./types";

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

interface ModalProps extends BaseModalProps {
  className?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
}

const Modal = ({
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
}: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

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

  if (!isOpen || typeof window === "undefined") {
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

  const stopModalEvent = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const stopModalPointerDown = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={stopModalEvent}
      onMouseDown={stopModalPointerDown}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleOverlayClick}
        onMouseDown={stopModalPointerDown}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={modalContentVariants({ className })}
        onClick={stopModalEvent}
        onMouseDown={stopModalPointerDown}
      >
        {children}
      </div>
    </div>,
    modalRoot,
  );
};

const modalContentVariants = cva("z-10 flex items-center justify-center");

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

export default Modal;
