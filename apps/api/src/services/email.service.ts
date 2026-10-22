import * as path from "node:path";
import { config } from "dotenv";
import QRCode from "qrcode";
import { Resend } from "resend";

export interface TicketEmailParams {
	toEmail: string;
	attendeeName: string;
	eventTitle: string;
	eventStart: Date | string;
	location: string | null;
	ticketCode: string;
	qrToken: string;
	tierName: string;
}

export async function sendTicketEmail(params: TicketEmailParams) {
	if (!process.env.RESEND_API_KEY) {
		config({ path: path.resolve(process.cwd(), ".env") });
		config({ path: path.resolve(process.cwd(), "../../.env") });
	}
	const apiKey = process.env.RESEND_API_KEY;

	if (!apiKey) {
		console.warn(
			"⚠️ RESEND_API_KEY is not set. Skipping ticket email dispatch.",
		);
		return null;
	}

	try {
		const resend = new Resend(apiKey);
		const appUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			process.env.APP_URL ||
			"http://localhost:3000";
		const passUrl = `${appUrl}/tickets/${params.ticketCode}`;

		// 1. Render PNG Buffer for inline QR code verification token
		const qrBuffer = await QRCode.toBuffer(params.qrToken, {
			width: 300,
			margin: 2,
			color: { dark: "#000000", light: "#ffffff" },
		});

		const formattedDate = new Date(params.eventStart).toLocaleDateString(
			"en-US",
			{
				weekday: "long",
				month: "long",
				day: "numeric",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
			},
		);

		const fromEmail =
			process.env.EMAIL_FROM || "makemyevent <onboarding@resend.dev>";

		// 2. Send email via Resend API with inline CID QR attachment
		const response = await resend.emails.send({
			from: fromEmail,
			to: [params.toEmail],
			subject: `Your Entry Ticket for ${params.eventTitle} [${params.ticketCode}]`,
			attachments: [
				{
					filename: "ticket-qr.png",
					content: qrBuffer,
					contentId: "ticket_qr",
				},
			],
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>Your Event Ticket</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 20px; color: #1b1a18;">
					<div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #dad6cc; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
						
						<!-- Header Banner -->
						<div style="background-color: #1f7a4d; padding: 24px; text-align: center; color: #ffffff;">
							<h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">makemyevent</h1>
							<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Your Event Pass is Confirmed!</p>
						</div>

						<!-- Body Content -->
						<div style="padding: 24px;">
							<p style="font-size: 15px; margin-top: 0;">Hi <strong>${params.attendeeName}</strong>,</p>
							<p style="font-size: 14px; color: #444; line-height: 1.5;">You're registered for <strong>${params.eventTitle}</strong>. Present your entry QR code at the check-in desk for admission.</p>
							
							<!-- Pass Stub -->
							<div style="background-color: #f9f8f5; border: 1px dashed #dad6cc; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
								<span style="font-size: 11px; font-weight: bold; font-family: monospace; text-transform: uppercase; background-color: #e6f4ea; color: #1f7a4d; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 10px;">${params.tierName}</span>
								
								<h2 style="font-size: 18px; margin: 5px 0; color: #1b1a18;">${params.eventTitle}</h2>
								<p style="font-size: 13px; color: #666; margin: 4px 0;">📅 ${formattedDate}</p>
								<p style="font-size: 13px; color: #666; margin: 4px 0 16px 0;">📍 ${params.location || "Venue TBA"}</p>
								
								<!-- Embedded QR Code -->
								<div style="background: #ffffff; padding: 12px; display: inline-block; border-radius: 8px; border: 1px solid #eee;">
									<img src="cid:ticket_qr" alt="Entry QR Code" style="width: 180px; height: 180px; display: block;" />
								</div>
								
								<p style="font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: 2px; color: #1b1a18; margin: 12px 0 0 0;">${params.ticketCode}</p>
							</div>

							<!-- Action Button -->
							<div style="text-align: center; margin: 28px 0 10px 0;">
								<a href="${passUrl}" style="background-color: #1f7a4d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">View Digital Pass →</a>
							</div>
						</div>

						<!-- Footer -->
						<div style="border-top: 1px solid #f0eee8; padding: 16px 24px; background-color: #faf9f6; text-align: center; font-size: 12px; color: #888;">
							<p style="margin: 0;">Show this pass on your mobile device at venue entry.</p>
						</div>
					</div>
				</body>
				</html>
			`,
		});

		if (response.error) {
			console.error(
				"❌ Resend API Error:",
				response.error.message || response.error,
			);
		} else {
			console.log(
				`✅ Ticket email sent successfully to ${params.toEmail} [${params.ticketCode}]`,
			);
		}
		return response;
	} catch (error) {
		console.error("❌ Failed to send ticket email via Resend:", error);
		return null;
	}
}

export interface InviteEmailParams {
	toEmail: string;
	recipientName?: string | null;
	role: string;
	targetName: string;
	type: "organization" | "community" | "event";
	actionUrl: string;
}

export async function sendInviteEmail(params: InviteEmailParams) {
	if (!process.env.RESEND_API_KEY) {
		config({ path: path.resolve(process.cwd(), ".env") });
		config({ path: path.resolve(process.cwd(), "../../.env") });
	}
	const apiKey = process.env.RESEND_API_KEY;

	if (!apiKey) {
		console.warn("⚠️ RESEND_API_KEY is not set. Skipping invitation email.");
		return null;
	}

	try {
		const resend = new Resend(apiKey);
		const fromEmail =
			process.env.EMAIL_FROM || "makemyevent <onboarding@resend.dev>";

		const subject = `You've been added as ${params.role} for ${params.targetName} on makemyevent`;

		const response = await resend.emails.send({
			from: fromEmail,
			to: [params.toEmail],
			subject,
			html: `
				<!DOCTYPE html>
				<html>
				<head><meta charset="utf-8"><title>${subject}</title></head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f6f2; margin: 0; padding: 20px; color: #1b1a18;">
					<div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #dad6cc; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
						<div style="background-color: #1f7a4d; padding: 24px; text-align: center; color: #ffffff;">
							<h1 style="margin: 0; font-size: 22px; font-weight: 700;">makemyevent</h1>
							<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Team & Volunteer Invitation</p>
						</div>
						<div style="padding: 24px;">
							<p style="font-size: 15px; margin-top: 0;">Hi <strong>${params.recipientName || params.toEmail}</strong>,</p>
							<p style="font-size: 14px; color: #444; line-height: 1.5;">You have been assigned as <strong>${params.role}</strong> for <strong>${params.targetName}</strong>.</p>
							<p style="font-size: 13px; color: #666; line-height: 1.5;">Sign in to your makemyevent account using <code>${params.toEmail}</code> to access your management tools, check-in scanner, and team privileges.</p>
							<div style="text-align: center; margin: 28px 0 10px 0;">
								<a href="${params.actionUrl}" style="background-color: #1f7a4d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">Open Dashboard & Access →</a>
							</div>
						</div>
						<div style="border-top: 1px solid #f0eee8; padding: 16px 24px; background-color: #faf9f6; text-align: center; font-size: 12px; color: #888;">
							<p style="margin: 0;">makemyevent • Event Operations & Community Hosting</p>
						</div>
					</div>
				</body>
				</html>
			`,
		});

		if (response.error) {
			console.error(
				"❌ Resend Invite Error:",
				response.error.message || response.error,
			);
		} else {
			console.log(
				`✅ Invite email sent to ${params.toEmail} for ${params.targetName}`,
			);
		}
		return response;
	} catch (error) {
		console.error("❌ Failed to send invitation email via Resend:", error);
		return null;
	}
}
