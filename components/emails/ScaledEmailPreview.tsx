"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";

interface ScaledEmailPreviewProps {
    html: string;
}

export function ScaledEmailPreview({ html }: ScaledEmailPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const shadowHostRef = useRef<HTMLDivElement>(null);
    const shadowRootRef = useRef<ShadowRoot | null>(null);

    const [containerWidth, setContainerWidth] = useState(0);
    const [contentMetrics, setContentMetrics] = useState({ scrollWidth: 0, height: 0 });

    const sanitizedHtml = useMemo(() => DOMPurify.sanitize(html), [html]);

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

    // Initialize Shadow DOM, inject content with base styles, and measure
    useEffect(() => {
        const hostEl = shadowHostRef.current;
        if (!hostEl) return;

        if (!shadowRootRef.current) {
            shadowRootRef.current = hostEl.attachShadow({ mode: "open" });
        }

        const shadowRoot = shadowRootRef.current;
        const baseStyles = `
            <style>
                :host {
                    display: block;
                }
                #email-content-wrapper {
                    display: flow-root; /* Prevent margin collapse so height is perfectly accurate */
                    box-sizing: border-box;
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #374151; /* gray-700 */
                    width: 100%;
                    overflow: visible;
                }
                img { max-width: 100%; height: auto; }
                a { pointer-events: none; cursor: default; color: #2563eb; text-decoration: underline; }
                ::-webkit-scrollbar { display: none; }
                * { scrollbar-width: none; ms-overflow-style: none; }
                
                /* Sensible defaults for standard HTML tags */
                ul { list-style-type: disc; padding-left: 2em; margin-top: 0.5em; margin-bottom: 0.5em; }
                ol { list-style-type: decimal; padding-left: 2em; margin-top: 0.5em; margin-bottom: 0.5em; }
                p { margin-top: 0.5em; margin-bottom: 0.5em; }
                h1, h2, h3, h4, h5, h6 { color: #111827; margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; }
                h1 { font-size: 1.5em; }
                h2 { font-size: 1.25em; }
                h3 { font-size: 1.125em; }
            </style>
        `;

        shadowRoot.innerHTML = `${baseStyles}<div id="email-content-wrapper">${sanitizedHtml}</div>`;

        const wrapper = shadowRoot.getElementById("email-content-wrapper");
        if (!wrapper) return;

        const measure = () => {
            setContentMetrics((prev) => {
                // wrapper.scrollWidth tells us if content overflows
                // hostEl.offsetHeight tells us the actual unscaled layout height
                if (prev.scrollWidth !== wrapper.scrollWidth || prev.height !== hostEl.offsetHeight) {
                    return { scrollWidth: wrapper.scrollWidth, height: hostEl.offsetHeight };
                }
                return prev;
            });
        };

        measure();

        // Observe size changes from content reflows
        const ro = new ResizeObserver(measure);
        ro.observe(wrapper);

        // Observe DOM mutations (in case sanitized HTML triggers layout shifts)
        const mo = new MutationObserver(measure);
        mo.observe(wrapper, { childList: true, subtree: true, attributes: true });

        // Handle images that haven't loaded yet
        wrapper.querySelectorAll("img").forEach((img) => {
            if (!img.complete) {
                img.addEventListener("load", measure, { once: true });
                img.addEventListener("error", measure, { once: true });
            }
        });

        // Fallback measurements for late-loading content
        const t1 = window.setTimeout(measure, 300);
        const t2 = window.setTimeout(measure, 1000);

        return () => {
            ro.disconnect();
            mo.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [sanitizedHtml]);

    const targetWidth = Math.max(containerWidth, contentMetrics.scrollWidth);
    const scale = containerWidth > 0 && targetWidth > 0
        ? containerWidth / targetWidth
        : 1;

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            <div
                ref={shadowHostRef}
                style={{
                    width: targetWidth > 0 ? targetWidth : "100%",
                    transformOrigin: "top left",
                    transform: `scale(${scale})`,
                    marginBottom: contentMetrics.height > 0 ? -contentMetrics.height * (1 - scale) : 0,
                    // Non-interactive preview styles
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            />
        </div>
    );
}
