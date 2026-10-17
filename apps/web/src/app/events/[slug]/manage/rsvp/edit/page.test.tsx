import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	form: null as unknown,
	mutate: vi.fn(),
	invalidate: vi.fn(),
	mutationOptions: null as null | {
		onSuccess?: () => void;
		onError?: (err: { message: string }) => void;
	},
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "demo" }) }));
vi.mock("@/components/ui/rich-text-editor", () => ({
	RichTextEditor: () => null,
}));
vi.mock("@/lib/trpc", () => ({
	trpc: {
		useUtils: () => ({
			events: { rsvpGetForm: { invalidate: mocks.invalidate } },
		}),
		events: {
			manageGetBySlug: {
				useQuery: () => ({ data: { id: "event1" }, isLoading: false }),
			},
			rsvpGetForm: {
				useQuery: () => ({ data: mocks.form, isLoading: false }),
			},
			rsvpUpdateForm: {
				useMutation: (options: typeof mocks.mutationOptions) => {
					mocks.mutationOptions = options;
					return { mutate: mocks.mutate, isPending: false };
				},
			},
		},
	},
}));

import { ManageRSVPPage } from "./page";

const form = (maxRsvpCount: number) => ({
	id: "form1",
	eventId: "event1",
	isPublished: true,
	allowEdit: false,
	requiresApproval: false,
	maxRsvpCount,
	description: null,
	customQuestions: [],
});

const capacity = () =>
	document.getElementById("max-rsvp-count") as HTMLInputElement;

describe("ManageRSVPPage capacity", () => {
	beforeEach(() => {
		mocks.mutate.mockClear();
		mocks.invalidate.mockClear();
	});
	afterEach(cleanup);

	it("saves an RSVP capacity other than 300 after clearing and retyping", async () => {
		const user = userEvent.setup();
		mocks.form = form(100);
		render(<ManageRSVPPage />);

		expect(capacity().value).toBe("100");
		await user.clear(capacity());
		expect(capacity().value).toBe("");
		await user.type(capacity(), "250");
		expect(capacity().value).toBe("250");

		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		expect(mocks.mutate).toHaveBeenCalledTimes(1);
		expect(mocks.mutate.mock.calls[0][0]).toMatchObject({
			slug: "demo",
			maxRsvpCount: 250,
		});
	});

	it("shows an error for an empty capacity and does not save", async () => {
		const user = userEvent.setup();
		mocks.form = form(100);
		render(<ManageRSVPPage />);

		await user.clear(capacity());
		await user.click(screen.getByRole("button", { name: /Save Changes/ }));

		expect(screen.getByText("Max RSVP capacity is required.")).toBeTruthy();
		expect(mocks.mutate).not.toHaveBeenCalled();

		await user.type(capacity(), "0");
		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		expect(
			screen.getByText("Max RSVP capacity must be at least 1."),
		).toBeTruthy();
		expect(mocks.mutate).not.toHaveBeenCalled();
	});

	it("surfaces a failed save instead of failing silently", async () => {
		const user = userEvent.setup();
		mocks.form = form(100);
		render(<ManageRSVPPage />);
		await user.click(screen.getByRole("button", { name: /Save Changes/ }));

		act(() => {
			mocks.mutationOptions?.onError?.({ message: "Could not save the form." });
		});
		expect(screen.getByText("Could not save the form.")).toBeTruthy();
	});

	it("keeps unsaved edits across a refetch and adopts server data after saving", async () => {
		const user = userEvent.setup();
		mocks.form = form(100);
		const { rerender } = render(<ManageRSVPPage />);

		await user.clear(capacity());
		await user.type(capacity(), "250");

		mocks.form = form(100);
		rerender(<ManageRSVPPage />);
		expect(capacity().value).toBe("250");

		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		act(() => {
			mocks.mutationOptions?.onSuccess?.();
		});
		mocks.form = form(250);
		rerender(<ManageRSVPPage />);
		expect(capacity().value).toBe("250");

		// No unsaved edits left, so a later server value is shown.
		mocks.form = form(180);
		rerender(<ManageRSVPPage />);
		expect(capacity().value).toBe("180");
	});
});
