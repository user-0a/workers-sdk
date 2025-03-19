import EMAIL_MESSAGE from "worker:email/email";
import SEND_EMAIL_BINDING from "worker:email/send_email";
import { z } from "zod";
import { Extension, Worker_Binding } from "../../runtime";
import { Plugin, WORKER_BINDING_SERVICE_LOOPBACK } from "../shared";

// Define the mutually exclusive schema
const EmailBindingOptionsSchema = z
	.object({
		name: z.string(),
	})
	.and(
		z.union([
			z.object({
				destination_address: z.string().optional(),
				allowed_destination_addresses: z.never().optional(),
			}),
			z.object({
				allowed_destination_addresses: z.array(z.string()).optional(),
				destination_address: z.never().optional(),
			}),
		])
	);

const EmailOptionsSchema = z.object({
	send_email: z.array(EmailBindingOptionsSchema).optional(),
});

export const EMAIL_PLUGIN_NAME = "email";
const SERVICE_SEND_EMAIL_PREFIX = "SEND-EMAIL";
const SERVICE_SEND_EMAIL_MODULE = `cloudflare-internal:${SERVICE_SEND_EMAIL_PREFIX}:module`;

function buildJsonBindings(bindings: Record<string, any>): Worker_Binding[] {
	return Object.entries(bindings).map(([name, value]) => ({
		name,
		json: JSON.stringify(value),
	}));
}

function createPlugin<O extends z.ZodType, S extends z.ZodType | undefined>(
	pluginDefinition: Plugin<O, S>
): Plugin<O, S> {
	return pluginDefinition;
}

export const EMAIL_PLUGIN = createPlugin({
	options: z.object({ email: EmailOptionsSchema.optional() }),
	getBindings(options): Worker_Binding[] {
		if (!options.email?.send_email) {
			return [];
		}

		const sendEmailBindings = options.email?.send_email;

		return sendEmailBindings.map(({ name, ...config }) => ({
			name,
			wrapped: {
				moduleName: SERVICE_SEND_EMAIL_MODULE,
				innerBindings: [
					...buildJsonBindings(config),
					WORKER_BINDING_SERVICE_LOOPBACK, // needed to send email to tmp folder
				],
			},
		}));
	},
	getNodeBindings(_options) {
		return {};
	},
	async getServices(args) {
		const extensions: Extension[] = [];
		// we only want to insert on the first worker as it will be shared between them
		if (args.workerIndex === 0) {
			extensions.push({
				modules: [
					{
						name: "cloudflare-internal:email",
						esModule: EMAIL_MESSAGE(),
						internal: true,
					},
				],
			});
		}

		const hasSendEmail =
			args.options.email?.send_email?.length !== undefined &&
			args.options.email?.send_email?.length > 0;
		// we only want to insert on the first worker as it will be shared between them
		if (args.workerIndex === 0 && hasSendEmail) {
			extensions.push({
				modules: [
					{
						name: SERVICE_SEND_EMAIL_MODULE,
						esModule: SEND_EMAIL_BINDING(),
						internal: true,
					},
				],
			});
		}

		return {
			services: [],
			extensions,
		};
	},
});
