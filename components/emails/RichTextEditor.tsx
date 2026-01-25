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
    $createParagraphNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
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

const editorTheme = {
    paragraph: "mb-2 last:mb-0",
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

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const lastEmittedRef = useRef<string>("");

    const handleChange = useCallback(
        (editorState: EditorState, editor: LexicalEditor) => {
            editorState.read(() => {
                const html = $generateHtmlFromNodes(editor);
                if (html !== lastEmittedRef.current) {
                    lastEmittedRef.current = html;
                    onChange(html);
                }
            });
        },
        [onChange],
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
                    <OnChangePlugin onChange={handleChange} />
                    <ExternalHtmlPlugin value={value} lastEmittedRef={lastEmittedRef} />
                </div>
            </LexicalComposer>
        </div>
    );
}
