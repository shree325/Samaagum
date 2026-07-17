import React from "react";
import { useAnalytics } from "../hooks/useAnalytics";

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  trackingName: string;
  trackingProps?: Record<string, any>;
  children: React.ReactNode;
}

export function CTAButton({
  variant = "primary",
  size = "md",
  href,
  trackingName,
  trackingProps,
  children,
  onClick,
  className = "",
  ...props
}: CTAButtonProps) {
  const { trackEvent } = useAnalytics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>) => {
    trackEvent(trackingName, trackingProps);
    if (onClick) {
      onClick(e);
    }
  };

  const btnClass = `btn btn-${variant} btn-${size} ${className}`;

  if (href) {
    return (
      <a href={href} className={btnClass} onClick={handleClick as any}>
        {children}
      </a>
    );
  }

  return (
    <button className={btnClass} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
export const I_arrow = (p = {}) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
