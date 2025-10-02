import { serve } from "bun";

import { handleProxyRequest } from "./src/proxyHandler";

const PORT: number = Number(process.env.PORT) || 3000;

serve({
	port: PORT,
	fetch(req: Request) {
		return handleProxyRequest(req);
	},
});

console.log(`Server running on port ${PORT}`);
