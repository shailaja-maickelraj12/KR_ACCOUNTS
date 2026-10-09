import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import apiRoutes from "./routes/api.routes.js";
import { sequelize } from "./models/index.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT || 6400);
const shouldSync = String(process.env.DB_SYNC).toLowerCase() === "true";
const shouldAlter = String(process.env.DB_ALTER).toLowerCase() === "true";

const allowedOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "https://krexports.org",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow dev connections
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Backend server is running smoothly!');
});


app.use("/ams", apiRoutes);
app.use(errorMiddleware);

const start = async () => {
  await sequelize.authenticate();
  if (shouldSync) {
    await sequelize.sync({ alter: shouldAlter });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`[ERP API] running on http://127.0.0.1:${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start ERP API:", error);
  process.exit(1);
});
