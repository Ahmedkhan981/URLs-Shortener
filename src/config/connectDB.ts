import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";


export const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL!, // ✅ narrowed to string after the guard
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDrizzle = drizzle(poolConnection);
