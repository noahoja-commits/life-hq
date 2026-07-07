/** Simple rich text editor using contentEditable — zero dependencies, always works */
import { useRef, useCallback, useEffect, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Code, Quote } from "lucide-react";

interface SimpleEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); };

export const SimpleEditor = ({ content, onChange, placeholder = "Start writing…", className }: SimpleEditorProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!content || content === "<p></p>" || content === "<p><br></p>");

  // Set initial content
  useEffect(() => {
    if (ref.current && content) {
      ref.current.innerHTML = content;
      setIsEmpty(!content || content === "<p></p>" || content === "<p><br></p>");
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    setIsEmpty(!html || html === "<br>" || html === "<p><br></p>");
    onChange(html);
  }, [onChange]);

  const focus = () => ref.current?.focus();

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5 bg-muted/30">
        <button type="button" onClick={() => { focus(); exec("bold"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bold className="size-3.5" />
        </button>
        <button type="button" onClick={() => { focus(); exec("italic"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Italic className="size-3.5" />
        </button>
        <button type="button" onClick={() => { focus(); exec("underline"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Underline className="size-3.5" />
        </button>
        <button type="button" onClick={() => { focus(); exec("strikeThrough"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <s className="text-[10px]">S</s>
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button type="button" onClick={() => { focus(); exec("formatBlock", "<h2>"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <span className="text-[10px] font-bold">H1</span>
        </button>
        <button type="button" onClick={() => { focus(); exec("formatBlock", "<h3>"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <span className="text-[10px] font-bold">H2</span>
        </button>
        <button type="button" onClick={() => { focus(); exec("formatBlock", "<p>"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <span className="text-[10px]">P</span>
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button type="button" onClick={() => { focus(); exec("insertUnorderedList"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <List className="size-3.5" />
        </button>
        <button type="button" onClick={() => { focus(); exec("insertOrderedList"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <ListOrdered className="size-3.5" />
        </button>
        <button type="button" onClick={() => { focus(); exec("formatBlock", "<blockquote>"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Quote className="size-3.5" />
        </button>
        <button type="button" onClick={() => { focus(); exec("formatBlock", "<pre>"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Code className="size-3.5" />
        </button>
      </div>
      {/* Editor */}
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="min-h-[300px] px-4 py-3 text-[15px] leading-7 outline-none focus:ring-1 focus:ring-ring/40"
          style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 px-4 py-3 text-[15px] leading-7 text-muted-foreground/40" aria-hidden>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
