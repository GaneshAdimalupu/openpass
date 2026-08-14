"use client";

import type { ChangeEvent, JSX } from "react";
import { useRef } from "react";

export interface RichTextEditorProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	rows?: number;
	className?: string;
}

export function RichTextEditor({
	id,
	value,
	onChange,
	placeholder = "Write something...",
	rows = 7,
	className = "",
}: RichTextEditorProps): JSX.Element {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const applyFormat = (
		prefix: string,
		suffix = "",
		defaultText = "",
		isBlock = false,
	) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = value.substring(start, end) || defaultText;

		let formattedText = `${prefix}${selectedText}${suffix}`;
		if (isBlock) {
			const needsNewlineBefore = start > 0 && value[start - 1] !== "\n";
			const needsNewlineAfter = end < value.length && value[end] !== "\n";
			formattedText = `${needsNewlineBefore ? "\n" : ""}${prefix}${selectedText}${suffix}${
				needsNewlineAfter ? "\n" : ""
			}`;
		}

		const newValue =
			value.substring(0, start) + formattedText + value.substring(end);
		onChange(newValue);

		// Restore focus and selection
		requestAnimationFrame(() => {
			textarea.focus();
			const newCursorPos = start + prefix.length + selectedText.length;
			textarea.setSelectionRange(start + prefix.length, newCursorPos);
		});
	};

	const handleLink = () => {
		const url = prompt("Enter URL:", "https://");
		if (url) {
			applyFormat("[", `](${url})`, "link text");
		}
	};

	const handleImage = () => {
		const url = prompt("Enter Image URL:", "https://");
		if (url) {
			applyFormat("![", `](${url})`, "image description", true);
		}
	};

	return (
		<div
			className={`border border-perforation rounded-lg bg-paper/50 overflow-hidden focus-within:border-stamp transition-colors ${className}`}
		>
			{/* Toolbar */}
			<div className="border-b border-perforation bg-paper/80 p-2 flex flex-wrap items-center gap-1">
				{/* Headings */}
				<button
					type="button"
					onClick={() => applyFormat("# ", "", "Heading 1", true)}
					className="px-2 py-1 text-xs font-semibold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Heading 1"
				>
					H1
				</button>
				<button
					type="button"
					onClick={() => applyFormat("## ", "", "Heading 2", true)}
					className="px-2 py-1 text-xs font-semibold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Heading 2"
				>
					H2
				</button>
				<button
					type="button"
					onClick={() => applyFormat("### ", "", "Heading 3", true)}
					className="px-2 py-1 text-xs font-semibold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Heading 3"
				>
					H3
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-0.5" />

				{/* Inline Styles: Bold, Italic, Underline, Strikethrough */}
				<button
					type="button"
					onClick={() => applyFormat("**", "**", "bold text")}
					className="px-2 py-1 text-xs font-bold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Bold"
				>
					B
				</button>
				<button
					type="button"
					onClick={() => applyFormat("*", "*", "italic text")}
					className="px-2 py-1 text-xs italic font-serif rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Italic"
				>
					I
				</button>
				<button
					type="button"
					onClick={() => applyFormat("<u>", "</u>", "underlined text")}
					className="px-2 py-1 text-xs underline rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Underline"
				>
					U
				</button>
				<button
					type="button"
					onClick={() => applyFormat("~~", "~~", "strikethrough text")}
					className="px-2 py-1 text-xs line-through rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Strikethrough"
				>
					S
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-0.5" />

				{/* Code */}
				<button
					type="button"
					onClick={() => applyFormat("`", "`", "code")}
					className="px-2 py-1 text-xs font-mono rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Inline Code"
				>
					{"<>"}
				</button>
				<button
					type="button"
					onClick={() => applyFormat("```\n", "\n```", "code block", true)}
					className="px-2 py-1 text-xs font-mono rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Code Block"
				>
					{"[<>]"}
				</button>

				<div className="w-[1px] h-4 bg-perforation mx-0.5" />

				{/* Lists */}
				<button
					type="button"
					onClick={() => applyFormat("- ", "", "List item", true)}
					className="p-1.5 rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
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
					onClick={() => applyFormat("1. ", "", "List item", true)}
					className="p-1.5 rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
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

				<div className="w-[1px] h-4 bg-perforation mx-0.5" />

				{/* Quote, Divider, Link, Image */}
				<button
					type="button"
					onClick={() => applyFormat("> ", "", "quote", true)}
					className="px-2 py-1 text-xs font-serif font-semibold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Blockquote"
				>
					”
				</button>
				<button
					type="button"
					onClick={() => applyFormat("\n---\n", "", "", true)}
					className="px-2 py-1 text-xs font-semibold rounded hover:bg-perforation/40 text-ink opacity-80 hover:opacity-100 transition-colors cursor-pointer"
					title="Horizontal Rule"
				>
					—
				</button>
				<button
					type="button"
					onClick={handleLink}
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
					onClick={handleImage}
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

			{/* Text Area */}
			<textarea
				ref={textareaRef}
				id={id}
				rows={rows}
				value={value}
				onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
					onChange(e.target.value)
				}
				placeholder={placeholder}
				className="w-full bg-paper p-3 text-xs text-body leading-relaxed focus:outline-none resize-y"
			/>
		</div>
	);
}
