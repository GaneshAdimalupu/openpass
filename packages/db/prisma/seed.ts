import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	const owner = await prisma.user.upsert({
		where: { email: "ganesh@openevents.dev" },
		update: {},
		create: {
			email: "ganesh@openevents.dev",
			name: "Ganesh Adimalupu",
		},
	});

	const organizer = await prisma.organizer.upsert({
		where: { slug: "playfest" },
		update: {},
		create: {
			type: "organization",
			name: "PlayFest",
			slug: "playfest",
			ownerId: owner.id,
		},
	});

	await prisma.event.upsert({
		where: { slug: "react-and-the-dom" },
		update: {},
		create: {
			title: "React and the DOM",
			slug: "react-and-the-dom",
			description:
				"A hands-on workshop covering how React actually updates the DOM under the hood.",
			category: "Workshop",
			status: "published",
			eventStart: new Date("2026-08-14T10:00:00+05:30"),
			eventEnd: new Date("2026-08-14T13:00:00+05:30"),
			registrationStart: new Date("2026-08-01T00:00:00+05:30"),
			registrationEnd: new Date("2026-08-13T23:59:00+05:30"),
			location: "Kochi",
			capacity: 60,
			organizerId: organizer.id,
			tickets: {
				create: [{ name: "General", price: 0, quantity: 60 }],
			},
		},
	});

	await prisma.event.upsert({
		where: { slug: "kelora-tech-fest" },
		update: {},
		create: {
			title: "Kelora Tech Fest",
			slug: "kelora-tech-fest",
			description:
				"A two-day tech fest with talks, workshops, and a hackathon track.",
			category: "Fest",
			status: "published",
			eventStart: new Date("2026-09-02T09:00:00+05:30"),
			eventEnd: new Date("2026-09-03T18:00:00+05:30"),
			registrationStart: new Date("2026-08-01T00:00:00+05:30"),
			registrationEnd: new Date("2026-09-01T23:59:00+05:30"),
			location: "Trivandrum",
			capacity: 500,
			organizerId: organizer.id,
			tickets: {
				create: [{ name: "General", price: 199, quantity: 500 }],
			},
		},
	});

	await prisma.event.upsert({
		where: { slug: "startup-summit" },
		update: {},
		create: {
			title: "Startup Summit",
			slug: "startup-summit",
			description:
				"A summit for early-stage founders, investors, and operators.",
			category: "Conference",
			status: "published",
			eventStart: new Date("2026-09-20T09:00:00+05:30"),
			eventEnd: new Date("2026-09-20T17:00:00+05:30"),
			registrationStart: new Date("2026-08-01T00:00:00+05:30"),
			registrationEnd: new Date("2026-09-19T23:59:00+05:30"),
			location: "Kochi",
			capacity: 200,
			organizerId: organizer.id,
			tickets: {
				create: [{ name: "General", price: 499, quantity: 0 }],
			},
		},
	});

	console.log("Seeded: 1 organizer, 3 events, 3 tickets");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
