import { handleProxyRequest } from "../../src/proxyHandler.js";

export const config = {
	runtime: "edge",
};

export default function handler(request: Request) {
	return handleProxyRequest(request, { stripPrefixSegments: 2 });
}


