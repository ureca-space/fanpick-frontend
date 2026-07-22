import styles from "./Skeleton.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const Skeleton = ({
  className = "",
  height,
  radius,
  style,
  variant = "box",
  width,
  ...restProps
}) => (
  <span
    {...restProps}
    aria-hidden="true"
    className={joinClassNames(
      styles.skeleton,
      styles[variant] ?? styles.box,
      className,
    )}
    style={{
      width,
      height,
      borderRadius: radius,
      ...style,
    }}
  />
);

Skeleton.Line = (props) => <Skeleton {...props} variant="line" />;
Skeleton.Circle = (props) => <Skeleton {...props} variant="circle" />;
Skeleton.Box = (props) => <Skeleton {...props} variant="box" />;

export default Skeleton;
