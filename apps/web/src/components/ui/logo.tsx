import Image from "next/image";
import type { JSX } from "react";

export interface LogoProps {
	variant?: "icon" | "wordmark" | "full";
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
}

export function Logo({
	variant = "icon",
	width = 32,
	height = 32,
	className = "w-8 h-8 object-contain",
	priority = false,
}: LogoProps): JSX.Element {
	if (variant === "wordmark") {
		return (
			<div className="relative inline-flex items-center justify-center">
				<Image
					src="/makemyevent-wordmark-light.svg"
					alt="makemyevent wordmark"
					width={width * 5}
					height={height}
					className={`dark:hidden ${className}`}
					priority={priority}
				/>
				<Image
					src="/makemyevent-wordmark-dark.svg"
					alt="makemyevent wordmark"
					width={width * 5}
					height={height}
					className={`hidden dark:block ${className}`}
					priority={priority}
				/>
			</div>
		);
	}

	if (variant === "full") {
		return (
			<div className="inline-flex items-center gap-2.5">
				<Logo
					variant="icon"
					width={width}
					height={height}
					className={className}
					priority={priority}
				/>
				<Logo
					variant="wordmark"
					width={width * 5}
					height={height}
					className="h-6 w-auto object-contain"
					priority={priority}
				/>
			</div>
		);
	}

	return (
		<div className="relative inline-flex items-center justify-center">
			<Image
				src="/makemyevent-light.svg"
				alt="makemyevent logo"
				width={width}
				height={height}
				className={`dark:hidden ${className}`}
				priority={priority}
			/>
			<Image
				src="/makemyevent-dark.svg"
				alt="makemyevent logo"
				width={width}
				height={height}
				className={`hidden dark:block ${className}`}
				priority={priority}
			/>
		</div>
	);
}
