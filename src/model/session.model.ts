import {
  bigint,
  boolean,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { UserModel } from "./UserModel.model.js";

// Rename "sessions" to "user_logins" or similar
export const sessionModel = mysqlTable("user_logins", { 
  id: serial("id").primaryKey().autoincrement().notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => UserModel.id, { onDelete: "cascade" }),
  isValid: boolean("is_valid").notNull().default(true),
  user_agent: text("user_agent").notNull(),
  ip_address: varchar("ip_address", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});