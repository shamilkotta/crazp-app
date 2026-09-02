"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@workspace/ui/lib/utils";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="h-full min-h-52 rounded-lg bg-background" />,
});

function useColorMode() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      setMode(root.classList.contains("dark") ? "dark" : "light");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return mode;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const colorMode = useColorMode();
  const frameRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(240);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (fullscreen) return;
    const el = frameRef.current;
    if (!el) return;
    const update = () => setHeight(Math.max(el.clientHeight, 160));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setFullscreen(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [fullscreen]);

  const editor = (
    <div
      ref={frameRef}
      data-color-mode={colorMode}
      className={cn(
        "overflow-hidden bg-background",
        fullscreen
          ? "fixed inset-0 z-[100] rounded-none border-0"
          : "min-h-52 rounded-lg border border-input",
        !fullscreen &&
          "[&_.w-md-editor]:border-0 [&_.w-md-editor]:bg-transparent [&_.w-md-editor]:shadow-none",
        "[&_.w-md-editor-toolbar]:border-border [&_.w-md-editor-toolbar]:bg-muted/50",
        "[&_.w-md-editor-content]:bg-background",
        "[&_.w-md-editor-toolbar_li>button:focus:not(:focus-visible)]:bg-transparent",
        "[&_.w-md-editor-toolbar_li>button:focus:not(:focus-visible)]:text-[var(--color-fg-default)]",
        "[&_.w-md-editor-toolbar_li>button:focus-visible]:bg-muted",
        !fullscreen && className
      )}
    >
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        height={fullscreen ? "100%" : height}
        preview="edit"
        visibleDragbar={false}
        overflow={false}
        fullscreen={fullscreen}
        textareaProps={{ placeholder }}
        commandsFilter={(command) => {
          if (command.name === "image" || command.keyCommand === "image") {
            return false;
          }
          if (
            command.name === "fullscreen" ||
            command.keyCommand === "fullscreen"
          ) {
            return {
              ...command,
              execute: () => setFullscreen((open) => !open),
            };
          }
          return command;
        }}
      />
    </div>
  );

  return (
    <>
      {fullscreen ? <div className={cn("min-h-52", className)} /> : editor}
      {fullscreen && mounted ? createPortal(editor, document.body) : null}
    </>
  );
}
