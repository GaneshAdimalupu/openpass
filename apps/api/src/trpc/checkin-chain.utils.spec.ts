import {
	chainParticipationPercent,
	orderChainNodes,
} from "./checkin-chain.utils";

describe("QR chain status helpers", () => {
	const root = {
		id: "root",
		parentNodeId: null,
		depth: 0,
		createdAt: new Date("2026-10-17T10:00:00Z"),
		issuedTicket: null,
	};
	const first = {
		id: "first",
		parentNodeId: "root",
		depth: 1,
		createdAt: new Date("2026-10-17T10:01:00Z"),
		issuedTicket: {
			attendeeName: "A",
			status: "CHECKED_IN",
			checkedInAt: new Date("2026-10-17T10:01:00Z"),
		},
	};
	const second = {
		id: "second",
		parentNodeId: "first",
		depth: 2,
		createdAt: new Date("2026-10-17T10:02:00Z"),
		issuedTicket: {
			attendeeName: "B",
			status: "CHECKED_IN",
			checkedInAt: new Date("2026-10-17T10:02:00Z"),
		},
	};

	it("orders nodes by their recorded parent links, not query order", () => {
		expect(
			orderChainNodes([second, root, first]).map((node) => node.id),
		).toEqual(["root", "first", "second"]);
	});

	it("does not attach disconnected nodes to the chain", () => {
		const orphan = { ...first, id: "orphan", parentNodeId: "missing" };
		expect(
			orderChainNodes([orphan, root, first]).map((node) => node.id),
		).toEqual(["root", "first"]);
	});

	it("returns no percentage when no eligible attendees exist", () => {
		expect(chainParticipationPercent(0, 0)).toBeNull();
	});

	it("computes participation from chain attendees and eligible tickets", () => {
		expect(chainParticipationPercent(2, 8)).toBe(25);
	});
});
