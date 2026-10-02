"use client";

import { useState, useEffect, useRef } from "react";
import { SITE_CONFIG } from "@/lib/constants";

const COPY_RESET_DELAY_MS = 2000;

export default function EmailButton(): React.JSX.Element {
  const [isCopied, setIsCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleEmailClick = async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.email);
      setIsCopied(true);
      setCopyFailed(false);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => setIsCopied(false),
        COPY_RESET_DELAY_MS,
      );
    } catch {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsCopied(false);
      setCopyFailed(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleEmailClick}
        aria-label="Copy email address"
        className="group font-medium text-foreground hover:text-muted-foreground transition-colors text-left"
      >
        {isCopied ? (
          "Copied"
        ) : (
          <span className="grid" style={{ justifyItems: "start" }}>
            <span className="col-start-1 row-start-1 opacity-100 group-hover:opacity-0 transition-opacity duration-0">
              Email
            </span>
            <span className="col-start-1 row-start-1 opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none">
              Copy
            </span>
          </span>
        )}
      </button>
      <span role="status" className="sr-only">
        {isCopied ? "Email address copied." : ""}
      </span>
      {copyFailed && (
        <span role="status" className="basis-full text-sm text-muted-foreground">
          Couldn&apos;t copy. Email{" "}
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="break-all font-medium text-foreground underline underline-offset-2"
          >
            {SITE_CONFIG.email}
          </a>
          .
        </span>
      )}
      <noscript>
        <a href={`mailto:${SITE_CONFIG.email}`} className="break-all font-medium">
          {SITE_CONFIG.email}
        </a>
      </noscript>
    </>
  );
}
