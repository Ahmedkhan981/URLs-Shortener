import {
  mysqlTable,
  serial,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";
import { UserModel } from "./UserModel.model.js";

export const URLModel = mysqlTable("URL_shortener", {
  id: serial("id").primaryKey(), // only auto-increment column
  originalUrl: varchar("originalUrl", { length: 255 }).notNull().unique(),
  shortUrl: varchar("shortUrl", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),

  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => UserModel.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});
