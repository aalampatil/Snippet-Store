import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { categoryRouter } from "./modules/categories/category.routes.js";
import { seedDefaultCategories } from "./modules/categories/category.service.js";
import { snippetRouter } from "./modules/snippets/snippet.routes.js";

async function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/", (req, res) => {
    res.json({ name: "snippet store" });
  });

  app.use("/api/categories", categoryRouter);
  app.use("/api/snippets", snippetRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  await seedDefaultCategories();

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`server is up on http://localhost:${env.port}`);
  });
}

createApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
