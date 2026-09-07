import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import { jobsRouter } from "./routes/jobs";
import { scenario1JobsRouter } from "./routes/scenario1Jobs";
import { scenario3JobsRouter } from "./routes/scenario3Jobs";
import { swaggerSpec } from "./swagger";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/jobs", jobsRouter);
app.use("/api/scenario1/jobs", scenario1JobsRouter);
app.use("/api/scenario3/jobs", scenario3JobsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  if (err instanceof multer.MulterError) {
    const field = err.field ? ` for '${err.field}'` : "";
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Uploaded file${field} exceeds the 100 MB limit.`
        : `Upload failed${field}: ${err.message}`;
    res.status(400).json({ error: message });
    return;
  }
  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "internal server error" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Scenario API listening on http://localhost:${port}`);
});
