/**
 * Reasoning placeholder scrub.
 *
 * DeepSeek-family models degenerate into repetition loops under long chains
 * of thought and emit runs of bare "Go." continuation tokens inside their
 * reasoning stream. Left in replayed history, those runs prime the next
 * turn's reasoning to repeat the pattern (the loop is self-reinforcing once
 * present in context).
 *
 * The scrub removes only whole lines that are a bare `Go`/`Go.`/`Go..`
 * placeholder from assistant `reasoning_content` / `reasoning` fields of
 * the provider payload, in place, before the request leaves the host.
 * Lines carrying any other text survive untouched; a field reduced to
 * nothing but placeholders is dropped so the provider shape stays clean.
 */

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whole-line placeholder emitted by the degenerate repetition loop. */
const PLACEHOLDER_LINE_RE = /^Go\.*$/;

function scrubText(text: string): string {
	// Cheap pre-filter: a placeholder line needs a literal "Go" to appear.
	if (!text.includes("Go")) return text;
	const lines = text.split("\n");
	const kept = lines.filter((line) => !PLACEHOLDER_LINE_RE.test(line.trim()));
	return kept.length === lines.length ? text : kept.join("\n");
}

/** Scrub placeholder reasoning lines from an in-place provider payload. */
export function stripPlaceholderReasoningLines(payload: unknown): void {
	if (!isObject(payload) || !Array.isArray(payload.messages)) return;
	for (const message of payload.messages) {
		if (!isObject(message) || message.role !== "assistant") continue;
		for (const field of ["reasoning_content", "reasoning"] as const) {
			const text = message[field];
			if (typeof text !== "string" || !text.includes("Go")) continue;
			const cleaned = scrubText(text);
			if (cleaned === text) continue;
			if (cleaned.trim().length === 0) delete message[field];
			else message[field] = cleaned;
		}
	}
}
