import { sqliteTable as table, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";



export const users = table('users', {
    id: text().primaryKey(),
    name: text().notNull(),
    username: text().notNull(),
    email: text().notNull().unique(),
    role: text().default('member'),
    password: text().notNull(),
    createdAt: integer({ mode: 'timestamp' }).notNull(),

}); 










