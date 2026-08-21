import "dotenv/config";
import { prisma } from "../src/client";

async function main() {
	console.log("Database initialized. Ready for user registrations and events.");
}

main()
	.catch((e) => {
		console.error("Seed error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
