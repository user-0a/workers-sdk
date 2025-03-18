import { EmailMessage } from "cloudflare:email";
import { env, WorkerEntrypoint } from "cloudflare:workers";
import { createMimeMessage } from "mimetext";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {}

export default class extends WorkerEntrypoint {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/error") throw new Error("Hello Error");

		// const msg = createMimeMessage();
		// // msg.setHeader("In-Reply-To", message.headers.get("Message-ID"));
		// msg.setSender({ name: "GPT-4", addr: "sender@penalosa.cloud" });
		// msg.setRecipient("message@from");
		// msg.setSubject("An email generated in a worker");
		// msg.addMessage({
		// 	contentType: "text/plain",
		// 	data: `Congratulations, you just sent an email from a worker.`,
		// });
		// var m = new EmailMessage(
		// 	"sender@penalosa.cloud",
		// 	"message@from",
		// 	msg.asRaw()
		// );
		// console.log(m);
		// _env.AI;
		this.ctx;
		return new Response("Hello World!");
	}
	async email(message: ForwardableEmailMessage) {
		const msg = createMimeMessage();
		msg.setHeader("In-Reply-To", message.headers.get("Message-ID")!);
		msg.setSender({ name: "Sender", addr: "sender@penalosa.cloud" });
		msg.setRecipient(message.from);
		msg.setSubject("An email generated in a worker");
		msg.addMessage({
			contentType: "text/plain",
			data: `Congratulations, you just sent an email from a worker.`,
		});

		var m = new EmailMessage(
			"sender@penalosa.cloud",
			message.from,
			msg.asRaw()
		);
		await message.forward(
			"samuel@macleod.space",
			new Headers({ hello: "world" })
		);
		message.setReject("Rejection reason");
		await message.reply(m);
	}

	async scheduled() {
		console.log("I'm scheduled!");
	}
}
