import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT || 5001,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || "root",
<<<<<<< HEAD
  DB_PASSWORD: process.env.DB_PASSWORD || "",
=======
  DB_PASSWORD: process.env.DB_PASSWORD || "1234",
>>>>>>> a822bae (Primer commit desde VS Code - ajustes y conexión API)
  DB_NAME: process.env.DB_NAME || "heladeria_db",
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-heladeria",
  NODE_ENV: process.env.NODE_ENV,
};
