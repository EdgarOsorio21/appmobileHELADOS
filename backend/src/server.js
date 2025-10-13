import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { pool } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "heladeria-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Conexión a MySQL establecida correctamente");
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos", error.message);
    process.exit(1);
  }

  app.listen(ENV.PORT, () => {
    console.log(`Helados Victoria API ejecutándose en el puerto ${ENV.PORT}`);
  });
};

startServer();
