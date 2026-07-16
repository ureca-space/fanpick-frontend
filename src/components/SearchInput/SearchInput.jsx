import { useEffect, useRef, useState } from "react";
import styles from "./SearchInput.module.css";

const SearchInput = ({
  value = "",
  onChange,
  placeholder = "검색어를 입력하세요",
  ariaLabel = "검색",
  debounceDelay = 500,
}) => {
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const lastCommittedValueRef = useRef(value);

  const [hasValue, setHasValue] = useState(Boolean(value));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    /*
     * 뒤로가기처럼 외부에서 URL 검색어가 변경된 경우에만
     * 실제 input 값을 동기화한다.
     */
    if (value === lastCommittedValueRef.current) {
      return;
    }

    lastCommittedValueRef.current = value;

    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }

    setHasValue(Boolean(value));
  }, [value]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const clearTimer = () => {
    window.clearTimeout(timerRef.current);
  };

  const commitSearch = () => {
    clearTimer();

    const currentValue = inputRef.current?.value ?? "";

    if (currentValue === lastCommittedValueRef.current) {
      return;
    }

    lastCommittedValueRef.current = currentValue;
    onChangeRef.current(currentValue);
  };

  const scheduleSearch = () => {
    clearTimer();

    timerRef.current = window.setTimeout(() => {
      /*
       * 이벤트 발생 당시의 값을 저장하지 않고
       * 500ms 후 input의 실제 최종값을 읽는다.
       */
      commitSearch();
    }, debounceDelay);
  };

  const handleInput = (event) => {
    setHasValue(Boolean(event.currentTarget.value));

    /*
     * 한글 조합 중이어도 타이머를 갱신한다.
     * input이 비제어 상태라 URL 변경이 한글 조합을 방해하지 않는다.
     */
    scheduleSearch();
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    commitSearch();
  };

  const handleClear = () => {
    clearTimer();

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }

    setHasValue(false);
    commitSearch();
  };

  return (
    <div className={styles.searchInput}>
      <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </svg>

      <input
        ref={inputRef}
        type="search"
        defaultValue={value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
      />

      {hasValue && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="검색어 지우기"
        >
          <span />
          <span />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
