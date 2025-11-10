CREATE TABLE "eventFavorites" (
	"userId" integer NOT NULL,
	"eventId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventUsers" (
	"userId" integer NOT NULL,
	"eventId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar NOT NULL,
	"status" varchar DEFAULT 'En cours',
	"streamingUrl" varchar(155) NOT NULL,
	"startAt" timestamp,
	"endAt" timestamp,
	"author" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"role" varchar(10) DEFAULT 'member',
	"password" varchar(16) NOT NULL,
	"createdAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "eventFavorites" ADD CONSTRAINT "eventFavorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventFavorites" ADD CONSTRAINT "eventFavorites_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventUsers" ADD CONSTRAINT "eventUsers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventUsers" ADD CONSTRAINT "eventUsers_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;