import {
  bigint,
  mysqlTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { UserModel } from "./UserModel.model.js";
import { sql } from "drizzle-orm";

export const verifyEmailTokenModel = mysqlTable("verify_email_token", {
  id: serial("id").primaryKey().autoincrement().notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => UserModel.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  code: varchar("code", { length: 8 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull().default(
    sql`(CURRENT_TIMESTAMP + INTERVAL 5 MINUTE)`,
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
