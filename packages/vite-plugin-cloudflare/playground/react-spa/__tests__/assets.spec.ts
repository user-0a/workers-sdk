import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { describe, expect, test } from "vitest";
import { isBuild, page, viteTestUrl } from "../../__test-utils__";

test("returns the correct home page", async () => {
	const content = await page.textContent("h1");
	expect(content).toBe("Vite + React");
});

test("allows updating state", async () => {
	const button = page.getByRole("button", { name: "increment" });
	const contentBefore = await button.innerText();
	expect(contentBefore).toBe("count is 0");
	await button.click();
	const contentAfter = await button.innerText();
	expect(contentAfter).toBe("count is 1");
});

test("returns the home page for not found routes", async () => {
	await page.goto(`${viteTestUrl}/random-page`);
	const content = await page.textContent("h1");
	expect(content).toBe("Vite + React");
});

describe("_headers", () => {
	test("applies _headers to HTML responses", async ({}) => {
		const response = await fetch(viteTestUrl);
		expect(response.headers.get("X-Header")).toBe("Custom-Value!!!");
	});

	test("applies _headers to static assets", async ({}) => {
		const response = await fetch(`${viteTestUrl}/vite.svg`);
		expect(response.headers.get("X-Header")).toBe("Custom-Value!!!");
	});

	test.skipIf(isBuild)(
		"reloads config when the _headers file changes",
		async ({ onTestFinished }) => {
			const headersPath = join(__dirname, "../public/_headers");
			const originalHeaders = readFileSync(headersPath, "utf8");
			onTestFinished(() => writeFileSync(headersPath, originalHeaders));

			const responseBefore = await fetch(viteTestUrl);
			expect(responseBefore.headers.get("X-Header")).toBe("Custom-Value!!!");

			writeFileSync(headersPath, "");

			// Wait for Vite to reload
			await setTimeout(500);

			const responseAfter = await fetch(viteTestUrl);
			expect(responseAfter.headers.get("X-Header")).not.toBe("Custom-Value!!!");
		}
	);
});
