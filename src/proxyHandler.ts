const DEFAULT_TIMEOUT = 30;
const DEFAULT_RETRIES = 3;

type HandlerOptions = {
	/** Amount of leading path segments to drop before extracting the Roblox subdomain. */
	stripPrefixSegments?: number;
};

const getEnv = () => {
	if (typeof process !== "undefined" && process.env) {
		return process.env;
	}
	// Edge runtime exposes env on globalThis under __ENV__ in some contexts
	// Fallback to empty object if nothing is available.
	return {} as Record<string, string>;
};

export async function handleProxyRequest(
	req: Request,
	options: HandlerOptions = {}
): Promise<Response> {
	const env = getEnv();
	const timeoutSeconds = Number(env.TIMEOUT ?? DEFAULT_TIMEOUT);
	const retries = Number(env.RETRIES ?? DEFAULT_RETRIES);
	const key = env.KEY;

	if (key && req.headers.get("proxykey") !== key) {
		return new Response("Missing or invalid PROXYKEY header.", {
			status: 407,
		});
	}

	const url = new URL(req.url);
	const rawSegments = url.pathname.split("/").filter(Boolean);
	const stripPrefixSegments = options.stripPrefixSegments ?? 0;
	let segments = rawSegments.slice(stripPrefixSegments);

	if (!options.stripPrefixSegments && rawSegments[0] === "api" && rawSegments[1] === "proxy") {
		segments = rawSegments.slice(2);
	}

	const [subdomain, ...pathParts] = segments;
	if (!subdomain || pathParts.length === 0) {
		return new Response("URL format invalid.", { status: 400 });
	}

	const targetPath = pathParts.join("/");
	const targetUrl = new URL(`https://${subdomain}.roblox.com/${targetPath}`);
	if (url.search) {
		targetUrl.search = url.search;
	}

	const proxyHeaders = new Headers(req.headers);
	proxyHeaders.set("user-agent", "RProxy");
	["roblox-id", "host", "content-length", "accept-encoding"].forEach(
		(header) => proxyHeaders.delete(header)
	);

	const method = req.method ?? "GET";
	const shouldIncludeBody = method !== "GET" && method !== "HEAD";
	const body = shouldIncludeBody ? await req.arrayBuffer() : undefined;

	const makeRequest = async (attempt: number): Promise<Response> => {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort("Request timed out"),
			timeoutSeconds * 1000
		);

		try {
			const proxyRes = await fetch(targetUrl, {
				method,
				headers: proxyHeaders,
				body,
				signal: controller.signal,
			});

			return new Response(proxyRes.body, {
				status: proxyRes.status,
				headers: proxyRes.headers,
			});
		} catch (error: any) {
			if (attempt >= retries) {
				const message =
					error?.name === "AbortError"
						? "Proxy request timed out."
						: "Proxy failed to connect. Please try again.";

				return new Response(message, { status: 500 });
			}

			console.error(`Attempt ${attempt} failed: ${error?.message ?? error}`);
			return makeRequest(attempt + 1);
		} finally {
			clearTimeout(timeoutId);
		}
	};

	return makeRequest(1);
}


