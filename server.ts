import { serve } from "bun";
import { fetch } from "bun";

const TIMEOUT: number = Number(process.env.TIMEOUT) || 30;
const RETRIES: number = Number(process.env.RETRIES) || 3;
const PORT: number = Number(process.env.PORT) || 3000;
const KEY: string | undefined = process.env.KEY;

serve({
	port: PORT,
	fetch: async (req) => {
		// Check for PROXYKEY header if KEY is set
		if (KEY && req.headers.get("proxykey") !== KEY) {
			return new Response("Missing or invalid PROXYKEY header.", {
				status: 407,
			});
		}

		const url = new URL(req.url);
		const [subdomain, ...pathParts] = url.pathname.slice(1).split("/");
		if (!subdomain || pathParts.length === 0) {
			return new Response("URL format invalid.", { status: 400 });
		}

		const targetUrl = `https://${subdomain}.roblox.com/${pathParts.join(
			"/"
		)}`;
		const proxyHeaders = new Headers(req.headers);

		const makeRequest = async (attempt: number = 1): Promise<Response> => {
			if (attempt > RETRIES) {
				return new Response(
					"Proxy failed to connect. Please try again.",
					{ status: 500 }
				);
			}

			try {
				const proxyRes = await fetch(targetUrl, {
					method: req.method,
					headers: proxyHeaders,
					body: req.body,
					signal: AbortSignal.timeout(TIMEOUT * 1000),
				});

				return new Response(proxyRes.body, {
					status: proxyRes.status,
					headers: proxyRes.headers,
				});
			} catch (error: any) {
				console.error(`Attempt ${attempt} failed: ${error.message}`);
				return makeRequest(attempt + 1);
			}
		};

		return makeRequest();
	},
});

console.log(`Server running on port ${PORT}`);
