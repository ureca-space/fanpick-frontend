import { useState } from "react";
import styles from "./WorldCupMedia.module.css";

const isVideoSource = (src = "") => /\.mp4(?:$|\?)/i.test(src);

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const WorldCupMedia = ({
  alt = "",
  className = "",
  draggable,
  fallbackClassName = "",
  fallbackLabel = "",
  loading,
  src,
  style,
}) => {
  const [failedSrc, setFailedSrc] = useState("");
  const hasError = Boolean(src && failedSrc === src);

  if (!src || hasError) {
    if (!fallbackLabel) {
      return null;
    }

    return (
      <span
        className={joinClassNames(
          styles.fallback,
          className,
          fallbackClassName,
        )}
      >
        {fallbackLabel}
      </span>
    );
  }

  const mediaClassName = joinClassNames(styles.media, className);

  if (isVideoSource(src)) {
    return (
      <video
        className={mediaClassName}
        src={src}
        style={style}
        referrerPolicy="no-referrer"
        autoPlay
        loop
        muted
        playsInline
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <img
      className={mediaClassName}
      src={src}
      style={style}
      referrerPolicy="no-referrer"
      alt={alt}
      draggable={draggable}
      loading={loading}
      onError={() => setFailedSrc(src)}
    />
  );
};

export default WorldCupMedia;
