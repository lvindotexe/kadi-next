import { MutableRefObject, useEffect } from "react";

export function useClickOutside(
  elementRef: MutableRefObject<HTMLElement | null>,
  callback: (...args: unknown[]) => void
) {
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (
        elementRef.current &&
        e.target instanceof Element &&
        !elementRef.current?.contains(e.target)
      )
        callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchend", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchend", handleClickOutside);
    };
  }, []);
}
