import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	data: null as unknown,
	mutate: vi.fn(),
	invalidate: vi.fn(),
	mutationOptions: null as null | { onSuccess?: () => void },
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "demo" }) }));
vi.mock("qrcode", () => ({
	default: { toDataURL: () => Promise.resolve("data:image/png;base64,") },
}));
vi.mock("@/components/tickets/ticket-designer-modal", () => ({
	TicketDesignerModal: () => null,
}));
vi.mock("@/lib/trpc", () => ({
	trpc: {
		useUtils: () => ({
			events: { ticketsGet: { invalidate: mocks.invalidate } },
		}),
		events: {
			ticketsGet: {
				useQuery: () => ({ data: mocks.data, isLoading: false }),
			},
			ticketsManageTiers: {
				useMutation: (options: { onSuccess?: () => void }) => {
					mocks.mutationOptions = options;
					return { mutate: mocks.mutate, isPending: false };
				},
			},
		},
	},
}));

import ManageTicketsPage from "./page";

const tier = (overrides: Record<string, unknown> = {}) => ({
	id: "cmtier1",
	eventId: "event1",
	name: "General Pass",
	description: null,
	price: 0,
	quantity: 300 as number | null,
	maxPerOrder: 1,
	salesStart: null,
	salesEnd: null,
	isPublished: true,
	allowWaitlist: true,
	allowTransfer: true,
	allowDrop: true,
	order: 0,
	confirmedCount: 0,
	waitlistCount: 0,
	checkedInCount: 0,
	droppedCount: 0,
	transferredCount: 0,
	isSoldOut: false,
	...overrides,
});

const response = (tiers: ReturnType<typeof tier>[]) => ({
	event: {},
	tiers,
	stats: {
		totalConfirmed: 0,
		totalWaitlisted: 0,
		totalCheckedIn: 0,
		totalDropped: 0,
		eventCapacity: 300,
	},
});

const field = (id: string) => document.getElementById(id) as HTMLInputElement;

async function openEditor(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: /Edit Pass/ }));
}

describe("ManageTicketsPage capacity and numeric inputs", () => {
	beforeEach(() => {
		mocks.mutate.mockClear();
		mocks.invalidate.mockClear();
	});
	afterEach(cleanup);

	it("saves a capacity other than 300 after clearing the field and typing a new value", async () => {
		const user = userEvent.setup();
		mocks.data = response([tier({ quantity: 300 })]);
		render(<ManageTicketsPage />);
		await openEditor(user);

		const capacity = field("modal-tier-capacity");
		expect(capacity.value).toBe("300");
		await user.clear(capacity);
		expect(capacity.value).toBe("");
		await user.type(capacity, "100");
		expect(capacity.value).toBe("100");

		await user.click(screen.getByRole("button", { name: "Update Ticket" }));
		expect(screen.getByText(/Registered:/).textContent).toContain("/ 100");

		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		expect(mocks.mutate).toHaveBeenCalledTimes(1);
		const sent = mocks.mutate.mock.calls[0][0];
		expect(sent.slug).toBe("demo");
		expect(sent.tiers).toHaveLength(1);
		expect(sent.tiers[0]).toMatchObject({ id: "cmtier1", quantity: 100 });
	});

	it("keeps an unlimited pass unlimited through edit and save", async () => {
		const user = userEvent.setup();
		mocks.data = response([tier({ quantity: null })]);
		render(<ManageTicketsPage />);

		expect(screen.getByText(/Registered:/).textContent).toContain("Unlimited");
		expect(screen.getAllByText("Unlimited").length).toBeGreaterThan(0);

		await openEditor(user);
		expect(
			(
				screen.getByRole("checkbox", {
					name: /Limit Capacity/,
				}) as HTMLInputElement
			).checked,
		).toBe(false);
		expect(document.getElementById("modal-tier-capacity")).toBeNull();

		await user.click(screen.getByRole("button", { name: "Update Ticket" }));
		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		expect(mocks.mutate.mock.calls[0][0].tiers[0].quantity).toBeNull();
	});

	it("does not insert or keep a zero while clearing price, capacity and max per order", async () => {
		const user = userEvent.setup();
		mocks.data = response([
			tier({ price: 499, quantity: 300, maxPerOrder: 4 }),
		]);
		render(<ManageTicketsPage />);
		await openEditor(user);

		const price = field("modal-tier-price");
		expect(price.value).toBe("499");
		await user.clear(price);
		expect(price.value).toBe("");
		await user.type(price, "250");
		expect(price.value).toBe("250");

		const maxPerOrder = field("modal-tier-max-order");
		await user.clear(maxPerOrder);
		expect(maxPerOrder.value).toBe("");
		await user.type(maxPerOrder, "6");
		expect(maxPerOrder.value).toBe("6");

		await user.click(screen.getByRole("button", { name: "Update Ticket" }));
		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		expect(mocks.mutate.mock.calls[0][0].tiers[0]).toMatchObject({
			price: 250,
			quantity: 300,
			maxPerOrder: 6,
		});
	});

	it("shows a clear error for an empty capacity instead of substituting 300", async () => {
		const user = userEvent.setup();
		mocks.data = response([tier({ quantity: 100 })]);
		render(<ManageTicketsPage />);
		await openEditor(user);

		await user.clear(field("modal-tier-capacity"));
		await user.click(screen.getByRole("button", { name: "Update Ticket" }));

		expect(screen.getByText("Capacity limit is required.")).toBeTruthy();
		// The editor stays open and nothing was queued for saving.
		expect(screen.getByRole("button", { name: "Update Ticket" })).toBeTruthy();
		expect(
			(
				screen.getByRole("button", {
					name: /Save Changes/,
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
		expect(mocks.mutate).not.toHaveBeenCalled();
	});

	it("rejects an empty or fractional price with a clear message", async () => {
		const user = userEvent.setup();
		mocks.data = response([tier({ price: 499 })]);
		render(<ManageTicketsPage />);
		await openEditor(user);

		const price = field("modal-tier-price");
		await user.clear(price);
		await user.click(screen.getByRole("button", { name: "Update Ticket" }));
		expect(screen.getByText("Ticket price is required.")).toBeTruthy();

		await user.type(price, "99.5");
		await user.click(screen.getByRole("button", { name: "Update Ticket" }));
		expect(screen.getByText(/whole number of rupees/)).toBeTruthy();
		expect(mocks.mutate).not.toHaveBeenCalled();
	});

	it("updates the live price preview on every keystroke", async () => {
		const user = userEvent.setup();
		mocks.data = response([tier({ price: 499 })]);
		render(<ManageTicketsPage />);
		await openEditor(user);

		expect(screen.getByText(/Total Price Inc GST/).textContent).toContain(
			"588.82",
		);
		const price = field("modal-tier-price");
		await user.clear(price);
		expect(screen.getByText(/Total Price Inc GST/).textContent).toContain(
			"0.00",
		);
		await user.type(price, "1000");
		expect(screen.getByText(/Total Price Inc GST/).textContent).toContain(
			"1180.00",
		);
	});

	it("keeps unsaved edits when the server data refetches, and re-syncs after saving", async () => {
		const user = userEvent.setup();
		mocks.data = response([tier({ quantity: 300 })]);
		const { rerender } = render(<ManageTicketsPage />);
		await openEditor(user);
		const capacity = field("modal-tier-capacity");
		await user.clear(capacity);
		await user.type(capacity, "100");
		await user.click(screen.getByRole("button", { name: "Update Ticket" }));

		// A background refetch returns the old saved value: it must not win.
		mocks.data = response([tier({ quantity: 300 })]);
		rerender(<ManageTicketsPage />);
		expect(screen.getByText(/Registered:/).textContent).toContain("/ 100");

		await user.click(screen.getByRole("button", { name: /Save Changes/ }));
		expect(mocks.mutate).toHaveBeenCalledTimes(1);
		act(() => {
			mocks.mutationOptions?.onSuccess?.();
		});

		// After the save, the refetched server state is adopted.
		mocks.data = response([tier({ quantity: 150 })]);
		rerender(<ManageTicketsPage />);
		expect(screen.getByText(/Registered:/).textContent).toContain("/ 150");
		expect(
			(
				screen.getByRole("button", {
					name: /Save Changes/,
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});
});
