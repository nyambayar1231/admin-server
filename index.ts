import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

app.get("/json", (c) => c.json({ message: "Hello from Hono", status: "ok" }));

app.post("/api/data", async (c) => {
  const body = await c.req.json();
  return c.json({ received: body, timestamp: Date.now() });
});

const port = process.env.PORT || 3000;

export default {
  port: Number(port),
  fetch: app.fetch,
};

console.log(`Server running at http://localhost:${port}`);