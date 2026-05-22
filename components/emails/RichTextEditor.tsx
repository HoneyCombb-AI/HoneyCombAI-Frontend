"use client";

import { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import type { EditorState, LexicalEditor } from "lexical";
import {
    $insertNodes,
    $createParagraphNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    FORMAT_TEXT_COMMAND,
    PASTE_COMMAND,
    type PasteCommandType,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListItemNode,
    ListNode,
    REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const BLOCK_GAP_PX = 14;
const LINE_HEIGHT = "1.45";

const BLOCK_TAGS = new Set(["P", "DIV"]);

function getBlockText(element: Element) {
    return (element.textContent || "").replace(/\u00a0/g, " ").trim();
}

function isEmptyBlock(element: Element) {
    if (!BLOCK_TAGS.has(element.tagName)) return false;
    if (element.querySelector("img, table, ul, ol")) return false;
    return getBlockText(element) === "";
}

function setEmailBlockStyle(element: HTMLElement, marginBottomPx: number) {
    element.removeAttribute("class");
    element.style.margin = `0 0 ${marginBottomPx}px 0`;
    element.style.lineHeight = LINE_HEIGHT;
}

function normalizeListsForEmail(root: ParentNode) {
    root.querySelectorAll("ul, ol").forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        element.removeAttribute("class");
        element.style.margin = "0 0 12px 20px";
        element.style.padding = "0";
        element.style.lineHeight = LINE_HEIGHT;
    });

    root.querySelectorAll("li").forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        element.removeAttribute("class");
        element.style.margin = "0 0 4px 0";
        element.style.lineHeight = LINE_HEIGHT;
    });
}

function normalizeLinksForEmail(root: ParentNode) {
    root.querySelectorAll("a").forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        element.removeAttribute("class");
        element.style.color = "#2563eb";
        element.style.textDecoration = "underline";
    });
}

function normalizeEmailHtml(html: string) {
    const trimmed = html.trim();
    if (!trimmed) return "";

    const document = new DOMParser().parseFromString(trimmed, "text/html");
    const body = document.body;

    body.querySelectorAll("script, style, meta, link, title").forEach((element) => {
        element.remove();
    });

    const children = Array.from(body.children);
    let previousContentBlock: HTMLElement | null = null;
    let pendingGapAfterPrevious = false;

    for (const child of children) {
        if (!(child instanceof HTMLElement)) continue;

        if (isEmptyBlock(child)) {
            if (previousContentBlock) {
                pendingGapAfterPrevious = true;
            }
            child.remove();
            continue;
        }

        if (BLOCK_TAGS.has(child.tagName)) {
            if (previousContentBlock) {
                setEmailBlockStyle(previousContentBlock, pendingGapAfterPrevious ? BLOCK_GAP_PX : 0);
            }
            previousContentBlock = child;
            pendingGapAfterPrevious = false;
        } else {
            if (previousContentBlock) {
                setEmailBlockStyle(previousContentBlock, pendingGapAfterPrevious ? BLOCK_GAP_PX : 0);
                previousContentBlock = null;
                pendingGapAfterPrevious = false;
            }
        }
    }

    if (previousContentBlock) {
        setEmailBlockStyle(previousContentBlock, 0);
    }

    normalizeListsForEmail(body);
    normalizeLinksForEmail(body);

    return body.innerHTML.trim();
}

function normalizePastedHtml(html: string) {
    const document = new DOMParser().parseFromString(html, "text/html");

    document.body.querySelectorAll("script, style, meta, link, title").forEach((element) => {
        element.remove();
    });

    document.body.querySelectorAll("[class]").forEach((element) => {
        const className = element.getAttribute("class") || "";
        if (/\b(Mso|Apple-)/i.test(className)) {
            element.removeAttribute("class");
        }
    });

    return document.body.innerHTML;
}

function getClipboardHtml(event: PasteCommandType) {
    if ("clipboardData" in event && event.clipboardData) {
        return event.clipboardData.getData("text/html");
    }

    return "";
}

const editorTheme = {
    paragraph: "my-0",
    text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
    },
    list: {
        ol: "list-decimal ml-6",
        ul: "list-disc ml-6",
        listitem: "my-1",
    },
    link: "text-blue-600 underline underline-offset-2",
};

const editorConfig = {
    namespace: "EmailComposer",
    theme: editorTheme,
    onError(error: Error) {
        console.error(error);
    },
    nodes: [ListNode, ListItemNode, LinkNode],
};

function Placeholder({ text }: { text: string }) {
    return (
        <div className="pointer-events-none absolute left-3 top-2 text-sm text-gray-400">
            {text}
        </div>
    );
}

function ToolbarButton({
    title,
    onClick,
    children,
}: {
    title: string;
    onClick: () => void;
    children: string;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200"
        >
            {children}
        </button>
    );
}

function ToolbarSeparator() {
    return <div className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />;
}

function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();

    const handleLink = () => {
        const url = window.prompt("Enter URL");
        if (url === null) return;
        const trimmed = url.trim();
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed === "" ? null : trimmed);
    };

    const clearFormatting = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.setFormat(0);
                selection.setStyle("");
            }
        });
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
            <ToolbarButton title="Bold" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
                B
            </ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
                I
            </ToolbarButton>
            <ToolbarButton
                title="Underline"
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
            >
                U
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
                title="Ordered list"
                onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
            >
                OL
            </ToolbarButton>
            <ToolbarButton
                title="Bullet list"
                onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
            >
                UL
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton title="Link" onClick={handleLink}>
                Link
            </ToolbarButton>
            <ToolbarButton title="Clear formatting" onClick={clearFormatting}>
                Clean
            </ToolbarButton>
        </div>
    );
}

function ExternalHtmlPlugin({
    value,
    lastEmittedRef,
}: {
    value: string;
    lastEmittedRef: { current: string };
}) {
    const [editor] = useLexicalComposerContext();
    const lastExternalRef = useRef<string | null>(null);

    useEffect(() => {
        const nextHtml = value ?? "";
        if (lastExternalRef.current === nextHtml) return;
        if (nextHtml === lastEmittedRef.current) {
            lastExternalRef.current = nextHtml;
            return;
        }

        editor.update(() => {
            const root = $getRoot();
            root.clear();

            if (nextHtml) {
                const dom = new DOMParser().parseFromString(nextHtml, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                if (nodes.length > 0) {
                    root.append(...nodes);
                } else {
                    root.append($createParagraphNode());
                }
            } else {
                root.append($createParagraphNode());
            }
        });

        lastExternalRef.current = nextHtml;
        lastEmittedRef.current = nextHtml;
    }, [editor, value, lastEmittedRef]);

    return null;
}

function PasteCleanupPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event) => {
                const html = getClipboardHtml(event);
                if (!html) return false;

                const normalizedHtml = normalizePastedHtml(html);
                if (!normalizedHtml) return false;

                event.preventDefault();
                const dom = new DOMParser().parseFromString(normalizedHtml, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                $insertNodes(nodes.length > 0 ? nodes : [$createParagraphNode()]);

                return true;
            },
            COMMAND_PRIORITY_LOW,
        );
    }, [editor]);

    return null;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const lastEmittedRef = useRef<string>("");
    const latestOnChangeRef = useRef(onChange);

    useEffect(() => {
        latestOnChangeRef.current = onChange;
    }, [onChange]);

    const handleChange = useCallback(
        (editorState: EditorState, editor: LexicalEditor) => {
            editorState.read(() => {
                const html = normalizeEmailHtml($generateHtmlFromNodes(editor));
                if (html !== lastEmittedRef.current) {
                    lastEmittedRef.current = html;
                    latestOnChangeRef.current(html);
                }
            });
        },
        [],
    );

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <LexicalComposer initialConfig={editorConfig}>
                <ToolbarPlugin />
                <div className="relative">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className="min-h-[200px] px-3 py-2 text-sm leading-6 outline-none" />
                        }
                        placeholder={<Placeholder text={placeholder || "Write your message..."} />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <PasteCleanupPlugin />
                    <OnChangePlugin onChange={handleChange} />
                    <ExternalHtmlPlugin value={value} lastEmittedRef={lastEmittedRef} />
                </div>
            </LexicalComposer>
        </div>
    );
}
