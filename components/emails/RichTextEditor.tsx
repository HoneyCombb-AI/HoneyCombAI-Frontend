"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Initialize Quill
        const quill = new Quill(editorRef.current, {
            theme: "snow",
            placeholder: placeholder || "Write your message...",
            modules: {
                toolbar: [
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link"],
                    ["clean"],
                ],
            },
        });

        quillRef.current = quill;

        // Set initial value
        if (value) {
            quill.root.innerHTML = value;
        }

        // Listen for changes
        quill.on("text-change", () => {
            onChange(quill.root.innerHTML);
        });

        return () => {
            quill.off("text-change");
        };
    }, []);

    // Update editor when value changes externally
    useEffect(() => {
        if (quillRef.current && value !== quillRef.current.root.innerHTML) {
            quillRef.current.root.innerHTML = value;
        }
    }, [value]);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div ref={editorRef} className="min-h-[200px]" />
        </div>
    );
}
