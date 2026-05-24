import {
  mysqlTable,
  serial,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const UserModel = mysqlTable("users", {
  id: serial("id").primaryKey().autoincrement().notNull(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  isEmailValid: boolean("is_email_valid").notNull().default(false),
  profilePicture: varchar("profile_picture", { length: 512 }),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Optional: Type for a user row
export type UserModelType = typeof UserModel.$inferSelect;
