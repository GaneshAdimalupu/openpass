"use client";

import type { JSX, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

export interface RichTextEditorProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	rows?: number;
	minHeight?: string;
	className?: string;
}

export function RichTextEditor({
	id,
	value,
	onChange,
	placeholder = "Write something...",
	rows = 7,
	minHeight,
	className = "",
}: RichTextEditorProps): JSX.Element {
	const editorRef = useRef<HTMLDivElement>(null);
	const isInternalUpdate = useRef<boolean>(false);
	const calculatedMinHeight = minHeight || `${rows * 24}px`;

	// Active format states for toolbar buttons
	const [activeFormats, setActiveFormats] = useState({
		h1: false,
		h2: false,
		h3: false,
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		code: false,
		quote: false,
		ul: false,
		ol: false,
	});

	// Sync value into contentEditable when changed externally
	useEffect(() => {
		if (editorRef.current && !isInternalUpdate.current) {
			if (editorRef.current.innerHTML !== (value || "")) {
				editorRef.current.innerHTML = value || "";
			}
		}
		isInternalUpdate.current = false;
	}, [value]);

	// Update active toolbar states based on cursor/selection
	const updateActiveStates = () => {
		const selection = window.getSelection();
		if (!selection?.anchorNode || !editorRef.current) return;
		if (!editorRef.current.contains(selection.anchorNode)) return;

		let node: Node | null = selection.anchorNode;
		if (node.nodeType === Node.TEXT_NODE) {
			node = node.parentNode;
		}

		let inH1 = false;
		let inH2 = false;
		let inH3 = false;
		let inQuote = false;
		let inCode = false;

		while (node && node !== editorRef.current) {
			const tag = (node as HTMLElement).tagName?.toUpperCase();
			if (tag === "H1") inH1 = true;
			if (tag === "H2") inH2 = true;
			if (tag === "H3") inH3 = true;
			if (tag === "BLOCKQUOTE") inQuote = true;
			if (tag === "CODE" || tag === "PRE") inCode = true;
			node = node.parentNode;
		}

		setActiveFormats({
			h1: inH1,
			h2: inH2,
			h3: inH3,
			bold: document.queryCommandState("bold"),
			italic: document.queryCommandState("italic"),
			underline: document.queryCommandState("underline"),
			strike: document.queryCommandState("strikeThrough"),
			code: inCode,
			quote: inQuote,
			ul: document.queryCommandState("insertUnorderedList"),
			ol: document.queryCommandState("insertOrderedList"),
		});
	};

	const handleInput = () => {
		if (editorRef.current) {
			isInternalUpdate.current = true;
			const html = editorRef.current.innerHTML;
			// If editor contains only empty br or empty tags, normalize to empty string
			if (
				html === "<br>" ||
				html === "<div><br></div>" ||
				html === "<p><br></p>" ||
				!html.trim()
			) {
				onChange("");
			} else {
				onChange(html);
			}
			updateActiveStates();
		}
	};

	const getClosestBlock = (startNode: Node | null): HTMLElement | null => {
		let current = startNode;
		if (current?.nodeType === Node.TEXT_NODE) {
			current = current.parentNode;
		}
		while (current && current !== editorRef.current) {
			const tag = (current as HTMLElement).tagName?.toUpperCase();
			if (
				["H1", "H2", "H3", "P", "DIV", "BLOCKQUOTE", "PRE", "LI"].includes(tag)
			) {
				return current as HTMLElement;
			}
			current = current.parentNode;
		}
		return null;
	};

	const exec = (
		e: MouseEvent<HTMLButtonElement>,
		command: string,
		arg = "",
	) => {
		e.preventDefault();
		if (editorRef.current) {
			editorRef.current.focus();
		}
		document.execCommand(command, false, arg);
		handleInput();
	};

	// Toggle heading: if already in that heading, revert to <p> (normal text)
	const handleFormatBlock = (e: MouseEvent<HTMLButtonElement>, tag: string) => {
		e.preventDefault();
		if (editorRef.current) {
			editorRef.current.focus();
		}

		const selection = window.getSelection();
		const block = selection ? getClosestBlock(selection.anchorNode) : null;
		const targetTagClean = tag.replace(/[<>]/g, "").toUpperCase();

		if (block && block.tagName === targetTagClean) {
			// Toggle OFF -> convert back to normal paragraph
			document.execCommand("formatBlock", false, "<p>");
		} else {
			// Toggle ON -> format to requested tag
			document.execCommand("formatBlock", false, tag);
		}
		handleInput();
	};

	const handleCode = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (editorRef.current) {
			editorRef.current.focus();
		}
		const selection = window.getSelection();
		const text = selection?.toString() || "code";
		document.execCommand("insertHTML", false, `<code>${text}</code>`);
		handleInput();
	};

	const handleLink = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		const url = prompt("Enter URL:", "https://");
		if (url && editorRef.current) {
			editorRef.current.focus();
			document.execCommand("createLink", false, url);
			handleInput();
		}
	};

	const handleImage = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		const url = prompt("Enter Image URL:", "https://");
		if (url && editorRef.current) {
			editorRef.current.focus();
			document.execCommand("insertImage", false, url);
			handleInput();
		}
	};

	// Handle Enter in Headings & Blockquotes -> Create normal <p> on next line
	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Tab") {
			e.preventDefault();
			document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
			handleInput();
			return;
		}

		if (e.key === "Enter" && !e.shiftKey) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				const block = getClosestBlock(range.startContainer);

				if (block && ["H1", "H2", "H3", "BLOCKQUOTE"].includes(block.tagName)) {
					e.preventDefault();

					// Create new normal paragraph element
					const p = document.createElement("p");
					p.innerHTML = "<br>";

					// Split content if cursor is in middle of heading, or append if at the end
					const isAtEnd =
						(range.startContainer.nodeType === Node.TEXT_NODE &&
							range.startOffset ===
								(range.startContainer.textContent || "").length) ||
						(range.startContainer === block &&
							range.startOffset === block.childNodes.length);

					if (isAtEnd) {
						block.parentNode?.insertBefore(p, block.nextSibling);
					} else {
						// Split heading: right side goes to new paragraph
						const rightRange = range.cloneRange();
						rightRange.selectNodeContents(block);
						rightRange.setStart(range.endContainer, range.endOffset);
						const extracted = rightRange.extractContents();
						if (
							extracted.textContent?.trim() ||
							extracted.childNodes.length > 0
						) {
							p.innerHTML = "";
							p.appendChild(extracted);
						}
						block.parentNode?.insertBefore(p, block.nextSibling);
					}

					// Set cursor into new paragraph
					const newRange = document.createRange();
					newRange.setStart(p, 0);
					newRange.collapse(true);
					selection.removeAllRanges();
					selection.addRange(newRange);

					handleInput();
					return;
				}
			}
		}
	};

	return (
		<div
			className={`border border-perforation rounded-lg bg-paper/50 overflow-hidden focus-within:border-stamp transition-colors ${className}`}
		>
			{/* Toolbar */}
			<div className="border-b border-perforation bg-paper/90 p-1.5 flex flex-wrap items-center gap-0.5 select-none">
				{/* Headings */}
				<button
					type="button"
					onMouseDown={(e) => handleFormatBlock(e, "<h1>")}
					className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
						activeFormats.h1
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title={
						activeFormats.h1
							? "Heading 1 (Click to revert to Normal text)"
							: "Heading 1"
					}
				>
					H1
				</button>
				<button
					type="button"
					onMouseDown={(e) => handleFormatBlock(e, "<h2>")}
					className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
						activeFormats.h2
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title={
						activeFormats.h2
							? "Heading 2 (Click to revert to Normal text)"
							: "Heading 2"
					}
				>
					H2
				</button>
				<button
					type="button"
					onMouseDown={(e) => handleFormatBlock(e, "<h3>")}
					className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
						activeFormats.h3
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title={
						activeFormats.h3
							? "Heading 3 (Click to revert to Normal text)"
							: "Heading 3"
					}
				>
					H3
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-1" />

				{/* Inline Styles: Bold, Italic, Underline, Strikethrough */}
				<button
					type="button"
					onMouseDown={(e) => exec(e, "bold")}
					className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
						activeFormats.bold
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Bold (Ctrl+B)"
				>
					B
				</button>
				<button
					type="button"
					onMouseDown={(e) => exec(e, "italic")}
					className={`px-2 py-1 text-xs italic font-serif rounded transition-colors cursor-pointer ${
						activeFormats.italic
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Italic (Ctrl+I)"
				>
					I
				</button>
				<button
					type="button"
					onMouseDown={(e) => exec(e, "underline")}
					className={`px-2 py-1 text-xs underline rounded transition-colors cursor-pointer ${
						activeFormats.underline
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Underline (Ctrl+U)"
				>
					U
				</button>
				<button
					type="button"
					onMouseDown={(e) => exec(e, "strikeThrough")}
					className={`px-2 py-1 text-xs line-through rounded transition-colors cursor-pointer ${
						activeFormats.strike
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Strikethrough"
				>
					S
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-1" />

				{/* Code */}
				<button
					type="button"
					onMouseDown={handleCode}
					className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
						activeFormats.code
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Inline Code"
				>
					{"<>"}
				</button>
				<button
					type="button"
					onMouseDown={(e) => handleFormatBlock(e, "<pre>")}
					className="px-2 py-1 text-xs font-mono rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Code Block"
				>
					{"[<>]"}
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-1" />

				{/* Lists */}
				<button
					type="button"
					onMouseDown={(e) => exec(e, "insertUnorderedList")}
					className={`p-1.5 rounded transition-colors cursor-pointer ${
						activeFormats.ul
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Bullet List"
					aria-label="Bullet List"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
				</button>
				<button
					type="button"
					onMouseDown={(e) => exec(e, "insertOrderedList")}
					className={`p-1.5 rounded transition-colors cursor-pointer ${
						activeFormats.ol
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Numbered List"
					aria-label="Numbered List"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="10" y1="6" x2="21" y2="6" />
						<line x1="10" y1="12" x2="21" y2="12" />
						<line x1="10" y1="18" x2="21" y2="18" />
						<path d="M4 6h1v4" />
						<path d="M4 10h2" />
						<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
					</svg>
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-1" />

				{/* Quote, Divider, Link, Image */}
				<button
					type="button"
					onMouseDown={(e) => handleFormatBlock(e, "<blockquote>")}
					className={`px-2 py-1 text-xs font-serif font-semibold rounded transition-colors cursor-pointer ${
						activeFormats.quote
							? "bg-stamp text-paper"
							: "hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100"
					}`}
					title="Blockquote"
				>
					”
				</button>
				<button
					type="button"
					onMouseDown={(e) => exec(e, "insertHorizontalRule")}
					className="px-2 py-1 text-xs font-semibold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Horizontal Divider"
				>
					—
				</button>
				<button
					type="button"
					onMouseDown={handleLink}
					className="p-1.5 rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Insert Link"
					aria-label="Insert Link"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					</svg>
				</button>
				<button
					type="button"
					onMouseDown={handleImage}
					className="p-1.5 rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Insert Image"
					aria-label="Insert Image"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
						<circle cx="9" cy="9" r="2" />
						<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
					</svg>
				</button>
			</div>

			{/* Visual WYSIWYG Editable Area */}
			{/* biome-ignore lint/a11y/useSemanticElements: contentEditable visual rich text editor */}
			<div
				ref={editorRef}
				id={id}
				role="textbox"
				tabIndex={0}
				aria-multiline="true"
				contentEditable
				suppressContentEditableWarning
				onInput={handleInput}
				onKeyUp={updateActiveStates}
				onMouseUp={updateActiveStates}
				onKeyDown={handleKeyDown}
				data-placeholder={placeholder}
				style={{ minHeight: calculatedMinHeight }}
				className="w-full bg-paper p-3 text-xs text-body leading-relaxed focus:outline-none overflow-y-auto rich-editor-content"
			/>
		</div>
	);
}
