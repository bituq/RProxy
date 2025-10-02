import { handleProxyRequest } from "../../src/proxyHandler";

export const config = {
	runtime: "edge",
};

export default function handler(request: Request) {
	return handleProxyRequest(request, { stripPrefixSegments: 2 });
}

