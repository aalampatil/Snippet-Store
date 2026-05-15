import express from "express";
import cors from "cors";

async function createApp() {
  const port = process.env.PORT || 3000;
  const app = express();
  app.use(cors());

  app.get("/health", (req, res) => {
    res.send("OK 200");
  });

  app.get("/", (req, res) => {
    res.send("snippet store");
  });

  app.listen(port, () => {
    console.log(`server is up on http://localhost:${port}`);
  });
}

createApp();
