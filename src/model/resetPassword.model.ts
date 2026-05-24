import {
  bigint,
  mysqlTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { UserModel } from "./UserModel.model.js";
import { sql } from "drizzle-orm";

export const resetPasswordModel = mysqlTable("reset_password_token", {
  id: serial("id").primaryKey().autoincrement().notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => UserModel.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  code: varchar("reset_password_code", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 hour)`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
