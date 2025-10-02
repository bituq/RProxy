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
	const requestOrigin = req.headers.get("origin");
	const allowOrigin = env.CORS_ALLOW_ORIGIN ?? requestOrigin ?? "*";
	const allowCredentials = env.CORS_ALLOW_CREDENTIALS === "true";
	const allowMethods = env.CORS_ALLOW_METHODS ?? "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS";
	const requestedHeaders =
		req.headers.get("access-control-request-headers") ??
		env.CORS_ALLOW_HEADERS ??
		"Content-Type, Authorization, PROXYKEY, proxykey";
	const exposeHeaders = env.CORS_EXPOSE_HEADERS ?? "Content-Type, Content-Length, ETag";
	const maxAge = env.CORS_MAX_AGE ?? "600";

	const buildCorsHeaders = (baseHeaders?: HeadersInit) => {
		const headers = new Headers(baseHeaders ?? {});
		headers.set("Access-Control-Allow-Origin", allowOrigin);
		if (allowOrigin !== "*") {
			const existingVary = headers.get("Vary");
			headers.set("Vary", existingVary ? `${existingVary}, Origin` : "Origin");
		}
		headers.set("Access-Control-Allow-Methods", allowMethods);
		headers.set("Access-Control-Allow-Headers", requestedHeaders);
		headers.set("Access-Control-Max-Age", maxAge);
		headers.set("Access-Control-Expose-Headers", exposeHeaders);
		headers.set("Access-Control-Allow-Credentials", allowCredentials ? "true" : "false");
		return headers;
	};

	if (req.method?.toUpperCase() === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: buildCorsHeaders(),
		});
	}

	if (key && req.headers.get("proxykey") !== key) {
		return new Response("Missing or invalid PROXYKEY header.", {
			status: 407,
			headers: buildCorsHeaders(),
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
		return new Response("URL format invalid.", {
			status: 400,
			headers: buildCorsHeaders(),
		});
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
				headers: buildCorsHeaders(proxyRes.headers),
			});
		} catch (error: any) {
			if (attempt >= retries) {
				const message =
					error?.name === "AbortError"
						? "Proxy request timed out."
						: "Proxy failed to connect. Please try again.";

				return new Response(message, {
					status: 500,
					headers: buildCorsHeaders(),
				});
			}

			console.error(`Attempt ${attempt} failed: ${error?.message ?? error}`);
			return makeRequest(attempt + 1);
		} finally {
			clearTimeout(timeoutId);
		}
	};

	return makeRequest(1);
}


