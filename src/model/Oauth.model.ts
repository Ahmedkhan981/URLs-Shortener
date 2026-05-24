import {
  bigint,
  mysqlEnum,
  mysqlTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { UserModel } from "./UserModel.model.js";

const PROVIDERS = ["google", "github", "microsoft", "facebook"] as const;

export type Provider = (typeof PROVIDERS)[number];

export const oauthModel = mysqlTable("oauth_accounts", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => UserModel.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  provider: mysqlEnum("provider", PROVIDERS).notNull(),

  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
