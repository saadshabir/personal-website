"use client";

import { useState, useEffect, useRef } from "react";

const COPY_RESET_DELAY_MS = 2000;

export default function EmailButton({
  email,
}: {
  email: string;
}): React.JSX.Element {
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
      await navigator.clipboard.writeText(email);
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
        className="text-link email-copy"
      >
        {isCopied ? "Copied" : "Email"}
      </button>
      <span role="status" className="sr-only">
        {isCopied ? "Email address copied." : ""}
      </span>
      {copyFailed && (
        <span role="status" className="email-copy-error">
          Couldn&apos;t copy. Email{" "}
          <a
            href={`mailto:${email}`}
            className="text-link email-address"
          >
            {email}
          </a>
          .
        </span>
      )}
      <noscript>
        <a href={`mailto:${email}`} className="text-link email-address">
          {email}
        </a>
      </noscript>
    </>
  );
}
