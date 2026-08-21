"use client";

import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import {
	Heading1,
	Heading2,
	Heading3,
	Type,
	Bold,
	Italic,
	List,
	ListOrdered,
	ListTodo,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Underline as UnderlineIcon,
	Link as LinkIcon,
	Quote,
	Code,
	Minus,
	Table as TableIcon,
	Undo,
	Redo,
} from "lucide-react";

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
}: RichTextEditorProps) {
	const calculatedMinHeight = minHeight || `${rows * 24}px`;

	const extensions = React.useMemo(
		() => [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				link: false,
				underline: false,
			}),
			Underline,
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableHeader,
			TableCell,
			Link.configure({
				openOnClick: false,
			}),
		],
		[],
	);

	const editor = useEditor({
		immediatelyRender: false,
		extensions,
		content: value,
		editorProps: {
			attributes: {
				class:
					"prose max-w-none w-full bg-paper text-ink p-4 focus:outline-none text-sm rich-editor-content",
				style: `min-height: ${calculatedMinHeight}`,
				"data-placeholder": placeholder,
			},
		},
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
	});

	const setLink = useCallback(() => {
		if (!editor) return;
		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);
		if (url === null) {
			return;
		}
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	const insertTable = useCallback(() => {
		if (!editor) return;
		editor
			.chain()
			.focus()
			.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
			.run();
	}, [editor]);

	if (!editor) {
		return null;
	}

	const ToolbarButton = ({
		onClick,
		isActive = false,
		icon: Icon,
		title,
	}: {
		onClick: () => void;
		isActive?: boolean;
		icon: React.ElementType;
		title?: string;
	}) => (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`p-1.5 rounded transition-colors flex items-center justify-center ${
				isActive
					? "bg-perforation text-ink"
					: "text-ink/60 hover:text-ink hover:bg-perforation/50"
			}`}
		>
			<Icon className="w-4 h-4" />
		</button>
	);

	return (
		<div id={id} className={`flex flex-col ${className}`}>
			<div className="border border-perforation rounded-lg overflow-hidden bg-paper focus-within:ring-2 focus-within:ring-perforation transition-shadow">
				{/* Toolbar */}
				<div className="flex flex-wrap items-center gap-1 p-1 border-b border-perforation bg-paper/50">
					<ToolbarButton
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						isActive={editor.isActive("heading", { level: 1 })}
						icon={Heading1}
						title="Heading 1"
					/>
					<ToolbarButton
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						isActive={editor.isActive("heading", { level: 2 })}
						icon={Heading2}
						title="Heading 2"
					/>
					<ToolbarButton
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
						isActive={editor.isActive("heading", { level: 3 })}
						icon={Heading3}
						title="Heading 3"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().setParagraph().run()}
						isActive={editor.isActive("paragraph")}
						icon={Type}
						title="Paragraph"
					/>
					<div className="w-px h-4 bg-perforation mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBold().run()}
						isActive={editor.isActive("bold")}
						icon={Bold}
						title="Bold"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleItalic().run()}
						isActive={editor.isActive("italic")}
						icon={Italic}
						title="Italic"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						isActive={editor.isActive("underline")}
						icon={UnderlineIcon}
						title="Underline"
					/>
					<div className="w-px h-4 bg-perforation mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						isActive={editor.isActive("bulletList")}
						icon={List}
						title="Bullet List"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						isActive={editor.isActive("orderedList")}
						icon={ListOrdered}
						title="Ordered List"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleTaskList().run()}
						isActive={editor.isActive("taskList")}
						icon={ListTodo}
						title="Task List"
					/>
					<div className="w-px h-4 bg-perforation mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().setTextAlign("left").run()}
						isActive={editor.isActive({ textAlign: "left" })}
						icon={AlignLeft}
						title="Align Left"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().setTextAlign("center").run()}
						isActive={editor.isActive({ textAlign: "center" })}
						icon={AlignCenter}
						title="Align Center"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().setTextAlign("right").run()}
						isActive={editor.isActive({ textAlign: "right" })}
						icon={AlignRight}
						title="Align Right"
					/>
					<div className="w-px h-4 bg-perforation mx-1" />

					<ToolbarButton
						onClick={setLink}
						isActive={editor.isActive("link")}
						icon={LinkIcon}
						title="Link"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						isActive={editor.isActive("blockquote")}
						icon={Quote}
						title="Blockquote"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						isActive={editor.isActive("codeBlock")}
						icon={Code}
						title="Code Block"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().setHorizontalRule().run()}
						icon={Minus}
						title="Divider"
					/>
					<ToolbarButton
						onClick={insertTable}
						isActive={editor.isActive("table")}
						icon={TableIcon}
						title="Table"
					/>
					<div className="w-px h-4 bg-perforation mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().undo().run()}
						icon={Undo}
						title="Undo"
					/>
					<ToolbarButton
						onClick={() => editor.chain().focus().redo().run()}
						icon={Redo}
						title="Redo"
					/>
				</div>

				{/* Editor Area */}
				<div className="bg-paper">
					<EditorContent editor={editor} />
				</div>
			</div>
		</div>
	);
}
