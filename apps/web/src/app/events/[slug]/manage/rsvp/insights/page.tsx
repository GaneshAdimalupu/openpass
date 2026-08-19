import { redirect } from "next/navigation";

export default async function RsvpInsightsRedirectPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const slug = (await params).slug;
	redirect(`/events/${slug}/manage/guests`);
}
