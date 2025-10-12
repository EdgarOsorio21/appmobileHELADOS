import bcrypt from "bcryptjs";
import { pool, query } from "../config/db.js";

export const findUserByEmail = async (email) => {
  const users = await query("SELECT * FROM users WHERE email = :email", { email });
  return users[0];
};

export const findUserById = async (id) => {
  const users = await query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = :id", { id });
  return users[0];
};

export const createUser = async ({ name, email, password, phone, role = "customer" }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash, phone, role) VALUES (:name, :email, :passwordHash, :phone, :role)",
    { name, email, passwordHash, phone, role }
  );
  return result.insertId;
};

export const listUsers = async () => {
  return query(
    `SELECT id, name, email, phone, role, created_at AS createdAt
     FROM users
     ORDER BY created_at DESC`
  );
};
