import { Link } from "react-router";
import styles from "./Button.module.css";

const Button = ({
  children,
  className = "",
  disabled = false,
  fullWidth = false,
  href,
  onClick,
  size = "md",
  to,
  type = "button",
  variant = "primary",
  tabIndex,
  ...restProps
}) => {
  const classNames = [
    styles.button,
    styles[variant] ?? styles.primary,
    styles[size] ?? styles.md,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  if (to) {
    return (
      <Link
        {...restProps}
        aria-disabled={disabled || undefined}
        className={classNames}
        onClick={handleClick}
        tabIndex={disabled ? -1 : tabIndex}
        to={to}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        {...restProps}
        aria-disabled={disabled || undefined}
        className={classNames}
        href={disabled ? undefined : href}
        onClick={handleClick}
        tabIndex={disabled ? -1 : tabIndex}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      {...restProps}
      className={classNames}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
