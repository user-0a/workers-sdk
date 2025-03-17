import * as path from "node:path";
import { constructHeaders } from "@cloudflare/workers-shared/utils/configuration/constructConfiguration";
import { parseHeaders } from "@cloudflare/workers-shared/utils/configuration/parseHeaders";
import { HEADERS_FILENAME } from "@cloudflare/workers-shared/utils/constants";
import { maybeGetFile } from "@cloudflare/workers-shared/utils/helpers";
import { HeadersSchema } from "@cloudflare/workers-shared/utils/types";
import { Log } from "miniflare";
import type { ResolvedPluginConfig } from "./plugin-config";
import type { ResolvedConfig } from "vite";
import type { Unstable_Config } from "wrangler";

export function getAssetsConfig(
	resolvedPluginConfig: ResolvedPluginConfig,
	workerAssetsConfig: Unstable_Config["assets"],
	viteLogger: Log,
	resolvedConfig: ResolvedConfig
) {
	const config =
		resolvedPluginConfig.type === "assets-only"
			? resolvedPluginConfig.config.assets
			: workerAssetsConfig;

	if (!config) {
		return {};
	}

	const logger = {
		debug: viteLogger.debug.bind(viteLogger),
		log: viteLogger.info.bind(viteLogger), // viteLogger doesn't have a `log()` method
		info: viteLogger.info.bind(viteLogger),
		warn: viteLogger.warn.bind(viteLogger),
		error: viteLogger.error.bind(viteLogger),
	};

	const headersFile = path.join(metadataDirectory, HEADERS_FILENAME);
	const headersContents = maybeGetFile(headersFile);
	const headers =
		headersContents &&
		HeadersSchema.parse(
			constructHeaders({
				headers: parseHeaders(headersContents),
				headersFile,
				logger,
			}).headers
		);

	return {
		...config,
		...(headers ? { headers } : {}),
	};
}
