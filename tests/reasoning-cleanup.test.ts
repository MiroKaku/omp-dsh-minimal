import test from "node:test";
import assert from "node:assert/strict";
import { stripPlaceholderReasoningLines } from "../src/adapter/reasoning-cleanup.ts";

test("removes whole-line Go placeholders and keeps real reasoning lines", () => {
	const payload = {
		messages: [
			{
				role: "assistant",
				reasoning_content: "Go.\n\nChecked the config loader path.\n\nGo.\n\nGo.",
				content: "done",
			},
		],
	};
	stripPlaceholderReasoningLines(payload);
	assert.equal(payload.messages[0].reasoning_content, "\nChecked the config loader path.\n\n");
});

test("drops the field entirely when only placeholders remain", () => {
	const payload = {
		messages: [{ role: "assistant", reasoning_content: "Go.\n\nGo.", content: "x" }],
	};
	stripPlaceholderReasoningLines(payload);
	assert.equal("reasoning_content" in payload.messages[0], false);
});

test("scrubs the legacy reasoning field too", () => {
	const payload = {
		messages: [{ role: "assistant", reasoning: "Go.\nReal line." }],
	};
	stripPlaceholderReasoningLines(payload);
	assert.equal(payload.messages[0].reasoning, "Real line.");
});

test("leaves non-placeholder text and non-assistant messages untouched", () => {
	const payload = {
		messages: [
			{ role: "assistant", reasoning_content: "Keep the build going.\nGo bold or stay home." },
			{ role: "user", reasoning_content: "Go." },
		],
	};
	const before = JSON.stringify(payload);
	stripPlaceholderReasoningLines(payload);
	assert.equal(JSON.stringify(payload), before);
});
