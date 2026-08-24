"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { trpc } from "@/lib/trpc";
import {
	Check,
	Copy,
	FileText,
	Mic,
	Plus,
	Sparkles,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface CustomField {
	id: string;
	question: string;
	type: string;
	is_mandatory: boolean;
	options: string;
	description: string;
}

export function ManageCFPPage() {
	const params = useParams();
	const slug = params.slug as string;

	// Queries
	const { data: event, isLoading: eventLoading } =
		trpc.events.manageGetBySlug.useQuery({ slug }, { enabled: !!slug });

	const { data: cfpForm, isLoading: cfpLoading } =
		trpc.events.cfpGetForm.useQuery({ slug }, { enabled: !!slug });

	const utils = trpc.useUtils();
	const { mutate: updateForm, isPending: isUpdating } =
		trpc.events.cfpUpdateForm.useMutation({
			onSuccess: () => {
				utils.events.cfpGetForm.invalidate({ slug });
				setHasChanges(false);
			},
		});

	// State matching FOSS United CFP structure
	const [isPublished, setIsPublished] = useState(false);
	const [allowEdit, setAllowEdit] = useState(true);
	const [anonymise, setAnonymise] = useState(false);
	const [hideReview, setHideReview] = useState(false);
	const [onlyWorkshops, setOnlyWorkshops] = useState(false);
	const [onlyTalks, setOnlyTalks] = useState(false);
	const [deadline, setDeadline] = useState("");
	const [publicCustomResponses, setPublicCustomResponses] = useState(false);
	const [guidelines, setGuidelines] = useState("");
	const [customFields, setCustomFields] = useState<CustomField[]>([]);
	const [hasChanges, setHasChanges] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (cfpForm) {
			setIsPublished(cfpForm.isPublished);
			setAllowEdit(cfpForm.allowEdit);
			setAnonymise(cfpForm.anonymiseProposals);
			setHideReview(cfpForm.hideReviews);
			setOnlyWorkshops(cfpForm.onlyWorkshops);
			setOnlyTalks(cfpForm.onlyTalks);
			setDeadline(
				cfpForm.deadline
					? new Date(cfpForm.deadline).toISOString().slice(0, 16)
					: "",
			);
			setPublicCustomResponses(cfpForm.publicCustomResponses);
			setGuidelines(cfpForm.guidelines || "");
			if (cfpForm.customQuestions) {
				setCustomFields(
					cfpForm.customQuestions.map((q) => ({
						id: q.id,
						question: q.question,
						type: q.type,
						is_mandatory: q.isMandatory,
						options: q.options || "",
						description: q.description || "",
					})),
				);
			}
		}
	}, [cfpForm]);

	useEffect(() => {
		if (cfpForm) {
			const formattedDeadline = cfpForm.deadline
				? new Date(cfpForm.deadline).toISOString().slice(0, 16)
				: "";
			const isDifferent =
				isPublished !== cfpForm.isPublished ||
				allowEdit !== cfpForm.allowEdit ||
				anonymise !== cfpForm.anonymiseProposals ||
				hideReview !== cfpForm.hideReviews ||
				onlyWorkshops !== cfpForm.onlyWorkshops ||
				onlyTalks !== cfpForm.onlyTalks ||
				deadline !== formattedDeadline ||
				publicCustomResponses !== cfpForm.publicCustomResponses ||
				guidelines !== (cfpForm.guidelines || "") ||
				customFields.length !== (cfpForm.customQuestions?.length ?? 0);
			setHasChanges(isDifferent);
		}
	}, [
		isPublished,
		allowEdit,
		anonymise,
		hideReview,
		onlyWorkshops,
		onlyTalks,
		deadline,
		publicCustomResponses,
		guidelines,
		customFields,
		cfpForm,
	]);

	const isLoading = eventLoading || cfpLoading;

	// Modal Dialog state
	const [showDialog, setShowDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const defaultFieldState: CustomField = {
		id: "",
		question: "",
		type: "Text",
		is_mandatory: false,
		options: "",
		description: "",
	};
	const [customField, setCustomField] =
		useState<CustomField>(defaultFieldState);

	const handleCopy = () => {
		const origin =
			typeof window !== "undefined"
				? window.location.origin
				: "https://makemyevent.org";
		navigator.clipboard.writeText(`${origin}/events/${slug}/cfp`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const openAddDialog = () => {
		setCustomField({ ...defaultFieldState, id: Date.now().toString() });
		setIsEditing(false);
		setShowDialog(true);
	};

	const openEditDialog = (field: CustomField) => {
		setCustomField({ ...field });
		setIsEditing(true);
		setShowDialog(true);
	};

	const saveCustomField = () => {
		if (!customField.question.trim()) return;
		if (isEditing) {
			setCustomFields(
				customFields.map((f) => (f.id === customField.id ? customField : f)),
			);
		} else {
			setCustomFields([...customFields, customField]);
		}
		setHasChanges(true);
		setShowDialog(false);
	};

	const deleteCustomField = () => {
		setCustomFields(customFields.filter((f) => f.id !== customField.id));
		setHasChanges(true);
		setShowDialog(false);
	};

	const handleSave = () => {
		updateForm({
			slug,
			isPublished,
			allowEdit,
			anonymiseProposals: anonymise,
			hideReviews: hideReview,
			onlyWorkshops,
			onlyTalks,
			deadline: deadline ? new Date(deadline).toISOString() : null,
			publicCustomResponses,
			guidelines: guidelines || null,
			customQuestions: customFields.map((f) => ({
				question: f.question,
				type: f.type,
				isMandatory: f.is_mandatory,
				options: f.options || null,
				description: f.description || null,
			})),
		});
	};

	const standardFields = [
		{
			label: "Proposal Title",
			description: "Title of the talk, workshop, or session",
			type: "Text",
		},
		{
			label: "Session Type",
			description: "Talk (30m), Workshop (2h), or Lightning Talk",
			type: "Select",
		},
		{
			label: "Abstract / Summary",
			description: "Summary of the topic and key takeaways for attendees",
			type: "Text Editor",
		},
		{
			label: "Target Audience",
			description: "Beginner, Intermediate, or Advanced practitioners",
			type: "Select",
		},
		{
			label: "Speaker Bio",
			description: "Speaker introduction and previous speaking experience",
			type: "Text Editor",
		},
		{
			label: "Slides / Prototype Link",
			description: "Links to draft slides, outline, or repository",
			type: "Text",
		},
	];

	if (isLoading) {
		return (
			<div className="p-8 space-y-6 max-w-5xl">
				<div className="h-8 w-48 bg-perforation/30 animate-pulse rounded" />
				<div className="h-36 bg-perforation/20 animate-pulse rounded-lg" />
				<div className="h-64 bg-perforation/10 animate-pulse rounded-lg" />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="p-8 text-ink/60">
				<p>Event not found.</p>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8 flex flex-col gap-8 max-w-5xl relative pb-28">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-perforation pb-6">
				<div>
					<h1 className="font-display font-semibold text-2xl text-ink">
						Call for Proposals (CFP)
					</h1>
					<p className="text-ink/60 text-sm mt-1">
						Configure whether this event accepts speaker submissions, setup talk
						topics, and define speaker guidelines.
					</p>
				</div>

				<button
					type="button"
					onClick={handleSave}
					disabled={isUpdating}
					className="px-5 py-2 bg-ink text-paper text-sm font-medium rounded-md hover:bg-ink/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2 self-start sm:self-auto"
				>
					<Upload className="w-4 h-4" />
					{isUpdating ? "Saving Changes..." : "Save Changes"}
				</button>
			</div>

			{/* Hero Feature Switch Card */}
			<div className="border border-perforation rounded-xl bg-paper p-6 space-y-4 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-lg flex items-center justify-center ${
								isPublished
									? "bg-stamp/10 text-stamp"
									: "bg-perforation/40 text-ink/50"
							}`}
						>
							<Mic className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="font-display font-semibold text-base text-ink">
									Enable Call for Proposals (CFP)
								</h2>
								{isPublished ? (
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-stamp/10 text-stamp border border-stamp/20 font-mono">
										<span className="w-1.5 h-1.5 rounded-full bg-stamp animate-pulse" />
										Accepting Submissions
									</span>
								) : (
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-perforation/40 text-ink/60 border border-perforation font-mono">
										<span className="w-1.5 h-1.5 rounded-full bg-ink/40" />
										Disabled (Curated Event)
									</span>
								)}
							</div>
							<p className="text-xs text-ink/60 mt-0.5">
								{isPublished
									? "CFP is open. Speakers can submit talk and workshop proposals through your public form."
									: "Curated Lineup. No open call for proposals — ideal if speakers are already confirmed or invited directly."}
							</p>
						</div>
					</div>

					{/* Switch Toggle */}
					<label className="relative inline-flex items-center cursor-pointer shrink-0">
						<input
							type="checkbox"
							checked={isPublished}
							onChange={(e) => {
								setIsPublished(e.target.checked);
								setHasChanges(true);
							}}
							className="sr-only peer"
						/>
						<div className="w-12 h-6 bg-perforation peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-paper after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-paper after:border-perforation after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stamp" />
					</label>
				</div>

				{/* Public Route (When Enabled) */}
				{isPublished && (
					<div className="pt-4 border-t border-perforation flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
						<span className="text-ink/70 font-medium">Public CFP Route:</span>
						<div className="flex items-center gap-2 flex-1 sm:max-w-md">
							<code className="px-3 py-1.5 bg-perforation/20 rounded font-mono text-xs border border-perforation text-ink flex-1 truncate">
								https://makemyevent.org/events/{slug}/cfp
							</code>
							<button
								type="button"
								onClick={handleCopy}
								className="p-1.5 border border-perforation rounded hover:bg-perforation/20 text-ink/70 hover:text-ink transition-colors inline-flex items-center gap-1 font-medium"
								title="Copy to clipboard"
							>
								{copied ? (
									<Check className="w-3.5 h-3.5 text-stamp" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
								{copied ? "Copied" : "Copy"}
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Inactive Notice Banner when Disabled */}
			{!isPublished && (
				<div className="bg-perforation/20 border border-dashed border-perforation rounded-lg p-5 flex items-start gap-3 text-sm text-ink/80">
					<Sparkles className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-ink">
							Call for Proposals is currently turned off
						</p>
						<p className="text-xs text-ink/60 mt-0.5">
							This event is set up as a curated speaker session or invited
							lineup. Turn on the toggle above whenever you wish to source talks
							from the community, establish submission rules, and configure
							review criteria.
						</p>
					</div>
				</div>
			)}

			{/* Form Builder & Settings (Dimmed when Disabled) */}
			<div
				className={`flex flex-col gap-8 transition-opacity duration-200 ${
					!isPublished
						? "opacity-40 pointer-events-none select-none filter grayscale-[40%]"
						: "opacity-100"
				}`}
			>
				{/* Edit Details Section */}
				<div className="flex flex-col gap-6">
					<div className="font-display font-semibold text-lg text-ink border-b border-perforation pb-2">
						Submission Rules & Settings
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Allow Proposal Edit */}
						<div className="flex flex-col gap-1">
							<label className="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									checked={allowEdit}
									onChange={(e) => {
										setAllowEdit(e.target.checked);
										setHasChanges(true);
									}}
									className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
								/>
								<span className="text-sm font-medium text-ink">
									Allow Proposal Edit
								</span>
							</label>
							<p className="text-xs text-ink/60 pl-6">
								Allow speakers to edit and refine their proposal after initial
								submission.
							</p>
						</div>

						{/* Anonymise Proposals */}
						<div className="flex flex-col gap-1">
							<label className="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									checked={anonymise}
									onChange={(e) => {
										setAnonymise(e.target.checked);
										setHasChanges(true);
									}}
									className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
								/>
								<span className="text-sm font-medium text-ink">
									Anonymise Proposals (Blind Review)
								</span>
							</label>
							<p className="text-xs text-ink/60 pl-6">
								Hides submitter identity and personal details from reviewers
								until shortlisted.
							</p>
						</div>

						{/* Hide Reviews */}
						<div className="flex flex-col gap-1">
							<label className="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									checked={hideReview}
									onChange={(e) => {
										setHideReview(e.target.checked);
										setHasChanges(true);
									}}
									className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
								/>
								<span className="text-sm font-medium text-ink">
									Hide Review Comments
								</span>
							</label>
							<p className="text-xs text-ink/60 pl-6">
								Keeps review scores and committee comments private from public
								view.
							</p>
						</div>

						{/* Public Custom Responses */}
						<div className="flex flex-col gap-1">
							<label className="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									checked={publicCustomResponses}
									onChange={(e) => {
										setPublicCustomResponses(e.target.checked);
										setHasChanges(true);
									}}
									className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
								/>
								<span className="text-sm font-medium text-ink">
									Public Custom Responses
								</span>
							</label>
							<p className="text-xs text-ink/60 pl-6">
								Show answers to custom questions publicly on the accepted
								proposal page.
							</p>
						</div>

						{/* Only Workshops */}
						<div className="flex flex-col gap-1">
							<label className="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									checked={onlyWorkshops}
									onChange={(e) => {
										setOnlyWorkshops(e.target.checked);
										if (e.target.checked) setOnlyTalks(false);
										setHasChanges(true);
									}}
									className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
								/>
								<span className="text-sm font-medium text-ink">
									Only Workshops
								</span>
							</label>
							<p className="text-xs text-ink/60 pl-6">
								Restrict submissions to workshop formats only.
							</p>
						</div>

						{/* Only Talks */}
						<div className="flex flex-col gap-1">
							<label className="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									checked={onlyTalks}
									onChange={(e) => {
										setOnlyTalks(e.target.checked);
										if (e.target.checked) setOnlyWorkshops(false);
										setHasChanges(true);
									}}
									className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
								/>
								<span className="text-sm font-medium text-ink">
									Only Talk Proposals
								</span>
							</label>
							<p className="text-xs text-ink/60 pl-6">
								Restrict submissions to talk sessions only.
							</p>
						</div>

						{/* Submission Deadline */}
						<div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
							<label
								htmlFor="cfp-deadline"
								className="text-sm font-medium text-ink"
							>
								Submission Deadline
							</label>
							<input
								id="cfp-deadline"
								type="datetime-local"
								value={deadline}
								onChange={(e) => {
									setDeadline(e.target.value);
									setHasChanges(true);
								}}
								className="w-full sm:w-80 px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
							/>
							<p className="text-xs text-ink/60">
								The form auto-closes once this date and time passes. Leave blank
								to manage closing manually.
							</p>
						</div>
					</div>

					{/* Guidelines Editor */}
					<div className="flex flex-col gap-2 mt-2">
						<label
							htmlFor="cfp-guidelines"
							className="text-sm font-medium text-ink"
						>
							CFP Guidelines & Information
						</label>
						<RichTextEditor
							id="cfp-guidelines"
							value={guidelines}
							onChange={(val) => {
								setGuidelines(val);
								setHasChanges(true);
							}}
							placeholder="Write guidelines, suggested topics, expectations, and review timeline for potential speakers..."
						/>
						<p className="text-xs text-ink/60">
							These instructions will be displayed at the top of the CFP
							submission form.
						</p>
					</div>
				</div>

				{/* Standard Fields Preview */}
				<div className="flex flex-col gap-4">
					<div className="font-display font-semibold text-lg text-ink border-b border-perforation pb-2">
						Standard Proposal Fields
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
						{standardFields.map((field) => (
							<div key={field.label} className="flex flex-col gap-1">
								<span className="text-sm font-medium text-ink/80 flex items-center gap-2">
									{field.label}
									<span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-perforation/40 rounded text-ink/60">
										{field.type}
									</span>
								</span>
								<input
									type="text"
									disabled
									placeholder={`Default ${field.type} Field`}
									className="px-3 py-2 bg-perforation/10 border border-perforation rounded-md text-xs text-ink/40 cursor-not-allowed"
								/>
								<p className="text-xs text-ink/50">{field.description}</p>
							</div>
						))}
					</div>
				</div>

				{/* Custom Questions Section */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between border-b border-perforation pb-2">
						<div>
							<h2 className="font-display font-semibold text-lg text-ink">
								Custom Questions
							</h2>
							<p className="text-xs text-ink/60 mt-0.5">
								Add event-specific questions (e.g. Travel grant requirements,
								co-speaker details).
							</p>
						</div>

						<button
							type="button"
							onClick={openAddDialog}
							className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink text-paper rounded-md font-medium text-sm hover:bg-ink/90 transition-colors shadow-sm"
						>
							<Plus className="w-4 h-4" /> Add Field
						</button>
					</div>

					{customFields.length === 0 ? (
						<div className="text-sm text-ink/60 p-8 border border-dashed border-perforation rounded-lg text-center bg-perforation/10 space-y-2">
							<FileText className="w-8 h-8 text-ink/30 mx-auto" />
							<p className="font-medium text-ink">No Custom Questions Added</p>
							<p className="text-xs text-ink/50 max-w-sm mx-auto">
								You can collect extra details like hardware requirements, target
								track, or demo setup.
							</p>
						</div>
					) : (
						<div className="border border-perforation rounded-lg overflow-hidden bg-paper shadow-sm">
							<table className="w-full text-left text-sm text-ink">
								<thead className="bg-perforation/20 border-b border-perforation text-xs uppercase tracking-wider text-ink/70 font-medium">
									<tr>
										<th className="px-4 py-3">Question</th>
										<th className="px-4 py-3">Type</th>
										<th className="px-4 py-3">Mandatory</th>
										<th className="px-4 py-3 text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-perforation">
									{customFields.map((field) => (
										<tr
											key={field.id}
											className="hover:bg-perforation/10 transition-colors"
										>
											<td className="px-4 py-3 font-medium text-ink">
												{field.question}
												{field.description && (
													<p className="text-xs text-ink/50 font-normal mt-0.5">
														{field.description}
													</p>
												)}
											</td>
											<td className="px-4 py-3">
												<span className="px-2 py-0.5 bg-perforation/30 border border-perforation rounded text-xs font-mono text-ink/80">
													{field.type}
												</span>
											</td>
											<td className="px-4 py-3">
												{field.is_mandatory ? (
													<span className="text-xs font-medium text-stamp bg-stamp/10 px-2 py-0.5 rounded">
														Required
													</span>
												) : (
													<span className="text-xs text-ink/40">Optional</span>
												)}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="inline-flex items-center gap-2">
													<button
														type="button"
														onClick={() => openEditDialog(field)}
														className="text-xs text-ink/70 hover:text-ink font-medium underline"
													>
														Edit
													</button>
													<button
														type="button"
														onClick={() => {
															setCustomFields(
																customFields.filter((f) => f.id !== field.id),
															);
															setHasChanges(true);
														}}
														className="text-xs text-alert hover:text-alert/80 p-1"
														title="Delete field"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Add/Edit Custom Field Dialog */}
			{showDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
					<div className="bg-paper border border-perforation rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
						<div className="px-6 py-4 border-b border-perforation flex justify-between items-center bg-paper">
							<h3 className="font-display font-semibold text-lg text-ink">
								{isEditing ? "Edit Custom Field" : "Add Custom Field"}
							</h3>
							<button
								type="button"
								onClick={() => setShowDialog(false)}
								className="text-ink/50 hover:text-ink p-1 rounded"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 overflow-y-auto flex flex-col gap-6">
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="field-question"
									className="text-sm font-medium text-ink"
								>
									Question Title *
								</label>
								<input
									id="field-question"
									type="text"
									value={customField.question}
									onChange={(e) =>
										setCustomField({ ...customField, question: e.target.value })
									}
									placeholder="e.g. Do you require hardware or special setup?"
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-1.5">
									<label
										htmlFor="field-type"
										className="text-sm font-medium text-ink"
									>
										Field Type
									</label>
									<select
										id="field-type"
										value={customField.type}
										onChange={(e) =>
											setCustomField({ ...customField, type: e.target.value })
										}
										className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
									>
										<option value="Text">Text (Single Line)</option>
										<option value="Select">Dropdown Select</option>
										<option value="Long Text">Long Text (Multi-line)</option>
										<option value="Text Editor">Rich Text Editor</option>
										<option value="Check">Checkbox Toggle</option>
										<option value="Radio Group">Radio Buttons</option>
									</select>
								</div>

								<div className="flex flex-col justify-center pt-5">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={customField.is_mandatory}
											onChange={(e) =>
												setCustomField({
													...customField,
													is_mandatory: e.target.checked,
												})
											}
											className="rounded border-perforation text-ink focus:ring-ink w-4 h-4"
										/>
										<span className="text-sm font-medium text-ink">
											Mandatory Field
										</span>
									</label>
								</div>
							</div>

							{(customField.type === "Select" ||
								customField.type === "Radio Group") && (
								<div className="flex flex-col gap-1.5">
									<label
										htmlFor="field-options"
										className="text-sm font-medium text-ink"
									>
										Options (One per line) *
									</label>
									<textarea
										id="field-options"
										value={customField.options}
										onChange={(e) =>
											setCustomField({
												...customField,
												options: e.target.value,
											})
										}
										rows={3}
										placeholder={"Option A\nOption B\nOption C"}
										className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none font-mono"
									/>
								</div>
							)}

							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="field-description"
									className="text-sm font-medium text-ink"
								>
									Help Text / Description
								</label>
								<textarea
									id="field-description"
									value={customField.description}
									onChange={(e) =>
										setCustomField({
											...customField,
											description: e.target.value,
										})
									}
									rows={2}
									placeholder="Optional guidance for the submitter..."
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
								/>
							</div>
						</div>

						<div className="px-6 py-4 border-t border-perforation bg-paper flex justify-end gap-3">
							{isEditing && (
								<button
									type="button"
									onClick={deleteCustomField}
									className="px-4 py-2 bg-alert/10 text-alert hover:bg-alert/20 font-medium text-sm rounded-md transition-colors mr-auto"
								>
									Delete
								</button>
							)}
							<button
								type="button"
								onClick={() => setShowDialog(false)}
								className="px-4 py-2 border border-perforation hover:bg-perforation/20 text-ink font-medium text-sm rounded-md transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={saveCustomField}
								disabled={!customField.question.trim()}
								className="px-4 py-2 bg-ink text-paper hover:bg-ink/90 font-medium text-sm rounded-md transition-colors disabled:opacity-50"
							>
								{isEditing ? "Save Field" : "Add Field"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Floating Action Bar */}
			{hasChanges && (
				<div className="fixed bottom-0 right-0 left-0 md:left-64 bg-paper border-t border-perforation px-6 py-4 flex justify-between items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
					<div className="text-sm text-ink/70 font-medium flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-alert" />
						You have unsaved changes
					</div>
					<button
						type="button"
						onClick={handleSave}
						disabled={isUpdating}
						className="px-5 py-2 text-sm bg-ink text-paper rounded-md hover:bg-ink/90 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50"
					>
						<Upload className="w-4 h-4" />
						{isUpdating ? "Saving Changes..." : "Save CFP Form"}
					</button>
				</div>
			)}
		</div>
	);
}

export default ManageCFPPage;
