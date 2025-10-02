export const config = {
  runtime: "edge",
};

export default function handler() {
  return new Response("pong", { status: 200 });
}
