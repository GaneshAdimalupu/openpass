export interface ChainStatusNode {
	id: string;
	parentNodeId: string | null;
	depth: number;
	createdAt: Date;
	issuedTicket: {
		attendeeName: string;
		status: string;
		checkedInAt: Date | null;
	} | null;
}

/** Return only nodes reachable from the recorded ROOT through parent links. */
export function orderChainNodes(nodes: ChainStatusNode[]): ChainStatusNode[] {
	const root = nodes.find((node) => node.parentNodeId === null);
	if (!root) return [];

	const nextByParent = new Map(
		nodes
			.filter((node) => node.parentNodeId !== null)
			.map((node) => [node.parentNodeId, node]),
	);
	const chain: ChainStatusNode[] = [];
	const visited = new Set<string>();
	let current: ChainStatusNode | undefined = root;
	while (current && !visited.has(current.id)) {
		visited.add(current.id);
		chain.push(current);
		current = nextByParent.get(current.id);
	}
	return chain;
}

export function chainParticipationPercent(
	chainAttendeeCount: number,
	eligibleAttendeeCount: number,
): number | null {
	if (eligibleAttendeeCount <= 0) return null;
	return (chainAttendeeCount / eligibleAttendeeCount) * 100;
}
