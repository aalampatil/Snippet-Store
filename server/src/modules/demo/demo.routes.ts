import { Router } from "express";

export const demoRouter = Router();

demoRouter.get("/", (req, res) => {
  res.json({ message: "ok 200" });
});
