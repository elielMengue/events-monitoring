import { sqliteTable as table, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users.model";

export const events = table('events', {
    id: text().primaryKey(),
    title: text().notNull(),
    description: text().notNull(),
    status: text().default('En cours'),
    streamingUrl: text(),
    startAt: integer({ mode: 'timestamp' }),
    endAt: integer({ mode: 'timestamp' }),
    author: text().notNull(),
    category: text().notNull(),
});




export const eventFavorites = table('eventFavorites', {
    id: text().primaryKey(),
    userId: text().notNull().references(() => users.id),
    eventId: text().notNull().references(() => events.id),
});

export const eventUsers = table('eventUsers', {
    id: text().primaryKey(),
    userId: text().notNull().references(() => users.id),
    eventId: text().notNull().references(() => events.id),
});


export const userRelation = relations(users, ({ many })  => ({
    registrations:many(eventUsers),
    favorites: many(eventFavorites)
}) );

export const eventRelation = relations(events, ({ many })  => ({
    registrations:many(eventUsers),
    favorites: many(eventFavorites),
}));

export const eventUserRelation = relations(eventUsers, ({ one }) => ({
    user: one(users, {
        fields: [eventUsers.userId],
        references: [users.id]
    }),

    event: one(events, {
        fields: [eventUsers.eventId],
        references: [events.id]
    })
}));

export const eventFavoriteRelation = relations(eventFavorites, ({ one }) => ({
    user: one(users, {
        fields: [eventFavorites.userId],
        references: [users.id]
    }),

    event: one(events, {
        fields: [eventFavorites.eventId],
        references: [events.id]
    })
}));