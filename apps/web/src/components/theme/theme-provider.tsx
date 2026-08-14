"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { JSX, ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "openevents-theme";

export interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: Theme;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
}: ThemeProviderProps): JSX.Element {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
			if (saved === "light" || saved === "dark" || saved === "system") {
				return saved;
			}
		}
		return defaultTheme;
	});

	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

	// Listen to system theme changes
	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemTheme(mediaQuery.matches ? "dark" : "light");

		const listener = (e: MediaQueryListEvent) => {
			setSystemTheme(e.matches ? "dark" : "light");
		};

		mediaQuery.addEventListener("change", listener);
		return () => mediaQuery.removeEventListener("change", listener);
	}, []);

	const resolvedTheme = useMemo<"light" | "dark">(() => {
		if (theme === "system") return systemTheme;
		return theme;
	}, [theme, systemTheme]);

	// Apply class and data-theme attribute
	useEffect(() => {
		if (typeof window === "undefined") return;
		const root = document.documentElement;

		if (resolvedTheme === "dark") {
			root.classList.add("dark");
			root.setAttribute("data-theme", "dark");
		} else {
			root.classList.remove("dark");
			root.setAttribute("data-theme", "light");
		}
	}, [resolvedTheme]);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, newTheme);
		}
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);

	const value = useMemo(
		() => ({
			theme,
			resolvedTheme,
			setTheme,
			toggleTheme,
		}),
		[theme, resolvedTheme, setTheme, toggleTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
