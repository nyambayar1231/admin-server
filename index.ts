import { Hono } from "hono";
import { connectDB } from "./src/config/database.js";
import userRoutes from "./src/routes/userRoutes.js";

const app = new Hono();

app.get("/", (c) => c.json({ message: "Admin Server API", status: "running" }));

app.get("/health", (c) =>
  c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
);

// API Routes
app.route("/api/users", userRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Route not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = process.env.PORT || 3000;

// Connect to database and start server
connectDB()
  .then(() => {
    console.log(`✓ Database connected`);
    console.log(`✓ Server running at http://localhost:${port}`);
  })
  .catch((error) => {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  });

export default {
  port: Number(port),
  fetch: app.fetch,
};
