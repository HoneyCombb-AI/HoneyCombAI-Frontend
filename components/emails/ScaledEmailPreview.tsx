"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ScaledEmailPreviewProps {
    /** Sanitized HTML body content (run through DOMPurify before being passed in). */
    html: string;
}
const SCALE = 0.75;
export const IFRAME_WIDTH = 660; // logical px — width of the iframe before scaling
const INITIAL_HEIGHT = 500;      // reasonable starting height before first measurement

export const PREVIEW_VISUAL_WIDTH = Math.round(IFRAME_WIDTH * SCALE);
function wrapInDocument(html: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; overflow: visible; }
  body { padding: 6px 8px; box-sizing: border-box; }
  img { max-width: 100%; height: auto; }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
</style>
</head>
<body>${html}</body>
</html>`;
}

export function ScaledEmailPreview({ html }: ScaledEmailPreviewProps) {
    const [contentHeight, setContentHeight] = useState(INITIAL_HEIGHT);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const observersRef = useRef<{ ro?: ResizeObserver; mo?: MutationObserver }>({});

    /** Measure the true content height from the iframe document. */
    const measureHeight = useCallback(() => {
        try {
            const doc = iframeRef.current?.contentDocument;
            if (!doc) return;

            const h = Math.max(
                doc.documentElement.scrollHeight,
                doc.body?.scrollHeight ?? 0,
                doc.body?.offsetHeight ?? 0,
            );

            if (h > 0) setContentHeight(h);
        } catch {
            // cross-origin guard
        }
    }, []);

    const handleLoad = useCallback(() => {
        observersRef.current.ro?.disconnect();
        observersRef.current.mo?.disconnect();

        requestAnimationFrame(() => {
            measureHeight();

            try {
                const body = iframeRef.current?.contentDocument?.body;
                if (!body) return;

                // ResizeObserver — fires on any layout size change
                const ro = new ResizeObserver(() => measureHeight());
                ro.observe(body);
                observersRef.current.ro = ro;

                // MutationObserver — catches DOM changes
                const mo = new MutationObserver(() => measureHeight());
                mo.observe(body, { childList: true, subtree: true, attributes: true });
                observersRef.current.mo = mo;

                // Watch images that haven't finished loading
                body.querySelectorAll("img").forEach((img) => {
                    if (!img.complete) {
                        img.addEventListener("load", measureHeight, { once: true });
                        img.addEventListener("error", measureHeight, { once: true });
                    }
                });

                // Extra safety for fonts and external resources
                setTimeout(measureHeight, 300);
                setTimeout(measureHeight, 1000);
            } catch {
                // cross-origin guard
            }
        });
    }, [measureHeight]);

    // Reset when email changes
    useEffect(() => {
        setContentHeight(INITIAL_HEIGHT);
    }, [html]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            observersRef.current.ro?.disconnect();
            observersRef.current.mo?.disconnect();
        };
    }, []);

    const outerWidth = PREVIEW_VISUAL_WIDTH;
    const outerHeight = Math.round(contentHeight * SCALE) + 15;
    const iframeHeight = contentHeight + 40; // buffer so content isn't clipped during measurement
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
                onLoad={handleLoad}
                style={{
                    width: IFRAME_WIDTH,
                    height: iframeHeight,
                    border: "none",
                    display: "block",
                    transformOrigin: "top left",
                    transform: `scale(${SCALE})`,
                    marginBottom: -(iframeHeight) * (1 - SCALE),
                }}
            />
        </div>
    );
}
