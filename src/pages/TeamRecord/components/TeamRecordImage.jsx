import { useMemo, useState } from "react";
import {
  EMPTY_IMAGE_SOURCES,
  FALLBACK_IMAGE_URL,
  isValidImageUrl,
} from "../teamRecordUtils";
import styles from "../TeamRecordPage.module.css";

const TeamRecordImage = ({
  src,
  className,
  alt = "",
  fallbackSrc = FALLBACK_IMAGE_URL,
  fallbackSources = EMPTY_IMAGE_SOURCES,
}) => {
  const sources = useMemo(
    () => [
      ...new Set([src, ...fallbackSources, fallbackSrc].filter(isValidImageUrl)),
    ],
    [fallbackSrc, fallbackSources, src],
  );
  const [failedSources, setFailedSources] = useState(() => new Set());
  const imageSrc =
    sources.find((source) => !failedSources.has(source)) || fallbackSrc;
  const isFallback = imageSrc === fallbackSrc;

  return (
    <img
      className={[className, isFallback ? styles.fallbackImage : ""]
        .filter(Boolean)
        .join(" ")}
      src={imageSrc}
      alt={alt}
      aria-hidden="true"
      onError={() => {
        setFailedSources((currentFailedSources) => {
          if (currentFailedSources.has(imageSrc)) {
            return currentFailedSources;
          }

          const nextFailedSources = new Set(currentFailedSources);
          nextFailedSources.add(imageSrc);
          return nextFailedSources;
        });
      }}
    />
  );
};

export default TeamRecordImage;
