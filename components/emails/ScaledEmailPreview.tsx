"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ScaledEmailPreviewProps {
    html: string;
}

const IFRAME_WIDTH = 660;

function wrapInDocument(html: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; overflow: visible; }
  body { padding: 4px 6px; box-sizing: border-box; }
  img { max-width: 100%; height: auto; }
  a { pointer-events: none; cursor: default; }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
</style>
</head>
<body>${html}</body>
</html>`;
}

export function ScaledEmailPreview({ html }: ScaledEmailPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const observersRef = useRef<{ ro?: ResizeObserver; mo?: MutationObserver; timeoutIds?: number[] }>({});

    const [containerWidth, setContainerWidth] = useState(0);
    const [contentHeight, setContentHeight] = useState(400);

    // Track container width
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setContainerWidth(el.offsetWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const scale = containerWidth > 0 ? containerWidth / IFRAME_WIDTH : 1;

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
        observersRef.current.timeoutIds?.forEach(clearTimeout);
        observersRef.current.timeoutIds = [];

        requestAnimationFrame(() => {
            measureHeight();
            try {
                const body = iframeRef.current?.contentDocument?.body;
                if (!body) return;

                const ro = new ResizeObserver(() => measureHeight());
                ro.observe(body);
                observersRef.current.ro = ro;

                const mo = new MutationObserver(() => measureHeight());
                mo.observe(body, { childList: true, subtree: true, attributes: true });
                observersRef.current.mo = mo;

                body.querySelectorAll("img").forEach((img) => {
                    if (!img.complete) {
                        img.addEventListener("load", measureHeight, { once: true });
                        img.addEventListener("error", measureHeight, { once: true });
                    }
                });

                observersRef.current.timeoutIds?.push(
                    window.setTimeout(measureHeight, 300),
                    window.setTimeout(measureHeight, 1000),
                );
            } catch {
                // cross-origin guard
            }
        });
    }, [measureHeight]);

    useEffect(() => {
        setContentHeight(400);
    }, [html]);

    useEffect(() => {
        return () => {
            observersRef.current.ro?.disconnect();
            observersRef.current.mo?.disconnect();
            observersRef.current.timeoutIds?.forEach(clearTimeout);
        };
    }, []);

    // iframe is rendered at full IFRAME_WIDTH then scaled down to fill the container
    const iframeHeight = contentHeight + 10;
    const outerHeight = Math.round(contentHeight * scale);

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: outerHeight, overflow: "hidden", flexShrink: 0 }}
        >
            <iframe
                ref={iframeRef}
                srcDoc={wrapInDocument(html)}
                sandbox="allow-same-origin"
                tabIndex={-1}
                title="Email preview"
                onLoad={handleLoad}
                style={{
                    width: IFRAME_WIDTH,
                    height: iframeHeight,
                    border: "none",
                    display: "block",
                    transformOrigin: "top left",
                    transform: `scale(${scale})`,
                    marginBottom: -iframeHeight * (1 - scale),
                }}
            />
        </div>
    );
}
