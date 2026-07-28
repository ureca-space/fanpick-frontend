import styles from "./LinkifiedText.module.css";

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s]+)/gi;
const URL_CHECK_PATTERN = /^(?:https?:\/\/|www\.)/i;
const TRAILING_SYMBOL_PATTERN = /[.,!?;:)\]}]+$/;

const LinkifiedText = ({ text = "", className = "" }) => {
  const parts = String(text).split(URL_PATTERN);

  return (
    <span className={`${styles.text} ${className}`.trim()}>
      {parts.map((part, index) => {
        if (!URL_CHECK_PATTERN.test(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        const trailingSymbols = part.match(TRAILING_SYMBOL_PATTERN)?.[0] ?? "";

        const visibleUrl = trailingSymbols
          ? part.slice(0, -trailingSymbols.length)
          : part;

        const href = visibleUrl.startsWith("www.")
          ? `https://${visibleUrl}`
          : visibleUrl;

        return (
          <span key={`${part}-${index}`}>
            <a
              className={styles.link}
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
            >
              {visibleUrl}
            </a>

            {trailingSymbols}
          </span>
        );
      })}
    </span>
  );
};

export default LinkifiedText;
