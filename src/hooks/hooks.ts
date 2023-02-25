import { MutableRefObject, useEffect } from "react";

export function useClickOutside(
  elementRef: MutableRefObject<HTMLElement | null>,
  callback: (...args: unknown[]) => void
) {
  useEffect(() => {
    if (elementRef.current === null) return;
    function handleClickOutside(e: Event) {
      if (e.target && !elementRef.current?.contains(e.target)) callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchend", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchend", handleClickOutside);
    };
  }, []);
}
