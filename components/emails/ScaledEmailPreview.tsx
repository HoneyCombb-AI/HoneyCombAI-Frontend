"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ScaledEmailPreviewProps {
    /** Sanitized HTML string (already run through DOMPurify before being passed in). */
    html: string;
}

const SCALE = 0.75;
export const IFRAME_WIDTH = 660; // logical px — width of the iframe before scaling
const INITIAL_HEIGHT = 500;      // fallback before onLoad fires

/**
 * Scaled visual width — exported so the message bubble can match it exactly.
 */
export const PREVIEW_VISUAL_WIDTH = Math.round(IFRAME_WIDTH * SCALE);

/**
 * Wrap the sanitized HTML in a minimal document.
 * We hide scrollbars visually but keep overflow visible so that
 * scrollHeight is measured correctly.
 */
function wrapInDocument(html: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html { overflow: hidden; }
  body { margin: 0; padding: 6px 8px; box-sizing: border-box; overflow: hidden; }
  img { max-width: 100%; height: auto; }
  /* Hide scrollbars in all browsers */
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
</style>
</head>
<body>${html}</body>
</html>`;
}

/**
 * Renders an HTML email body inside a sandboxed, CSS-scaled <iframe>.
 * The outer wrapper auto-fits to the full scaled content height — no clipping,
 * no scrollbar, no expand/collapse.
 */
export function ScaledEmailPreview({ html }: ScaledEmailPreviewProps) {
    const [contentHeight, setContentHeight] = useState(INITIAL_HEIGHT);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const measureHeight = useCallback(() => {
        // Defer one frame so the browser has finished painting before we read
        // the content dimensions.
        requestAnimationFrame(() => {
            try {
                const doc = iframeRef.current?.contentDocument;
                if (!doc) return;
                // Remove overflow:hidden temporarily to get the real scroll height
                const html = doc.documentElement;
                const body = doc.body;
                const prevHtmlOverflow = html.style.overflow;
                const prevBodyOverflow = body.style.overflow;
                html.style.overflow = "visible";
                body.style.overflow = "visible";

                const h = Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.scrollHeight,
                    html.offsetHeight,
                );

                // Restore
                html.style.overflow = prevHtmlOverflow;
                body.style.overflow = prevBodyOverflow;

                if (h > 0) setContentHeight(h);
            } catch {
                // sandboxed cross-origin guard
            }
        });
    }, []);

    // Reset when email changes
    useEffect(() => {
        setContentHeight(INITIAL_HEIGHT);
    }, [html]);

    const outerWidth = PREVIEW_VISUAL_WIDTH;
    const outerHeight = Math.round(contentHeight * SCALE);
    const srcDoc = wrapInDocument(html);

    return (
        <div
            style={{
                width: outerWidth,
                height: outerHeight,
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            <iframe
                ref={iframeRef}
                srcDoc={srcDoc}
                sandbox="allow-popups"
                tabIndex={-1}
                title="Email preview"
                onLoad={measureHeight}
                style={{
                    width: IFRAME_WIDTH,
                    height: contentHeight + 40, // +40 px: safe margin so email footer isn't clipped
                    border: "none",
                    display: "block",
                    transformOrigin: "top left",
                    transform: `scale(${SCALE})`,
                    marginBottom: -(contentHeight + 40) * (1 - SCALE),
                }}
            />
        </div>
    );
}
