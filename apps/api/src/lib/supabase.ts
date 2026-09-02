import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.warn(
		"[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — storage features will be unavailable.",
	);
}

/**
 * Supabase admin client — uses the service role key for server-side
 * storage operations. NEVER expose this client or key to the browser.
 */
export const supabaseAdmin =
	supabaseUrl && supabaseServiceKey
		? createClient(supabaseUrl, supabaseServiceKey, {
				auth: { persistSession: false },
			})
		: null;
