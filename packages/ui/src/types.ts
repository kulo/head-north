/**
 * UI Component Types
 *
 * Shared types for UI components
 */

export interface BaseComponentProps {
  id?: string;
  className?: string;
  testId?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: boolean;
  footer?: boolean;
}
