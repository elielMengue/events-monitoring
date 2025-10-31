import request from 'supertest';
import { describe, test, expect, beforeAll } from 'bun:test';
import { faker } from '@faker-js/faker';
import app from '../app/server';
import { type EventEntry, Event } from '../features/events/domain/entity.events';
import { UserService } from '../features/users/domain/service.users';
import { InMemoryUserRepository } from '../features/users/outbound/adapter.users';
import { AuthService } from '../lib/port.auth';
import { User } from '../features/users/domain/entity.users';

describe("Tests de fonctionnalité", () => {
    let adminUser: any;
    let regularUser: any;
    let adminToken: string;
    let userToken: string;
    let testEvent: Event;

    beforeAll(async () => {
        const authService = new AuthService('secret');
        const userRepository = new InMemoryUserRepository();
        const userService = new UserService(userRepository, authService);

        adminUser = {
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: faker.internet.password(),
            role: 'admin'
        };
        const adminUserEntity = new User(adminUser);
        await userService.createUser(adminUserEntity);
        adminToken = await userService.loginUser(adminUser.email, adminUser.password);
        adminUser.user_id = (await authService.verify(adminToken)).userId;

        regularUser = {
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: faker.internet.password(),
            role: 'member'
        };

        const regularUserEntity = new User(regularUser);
        await userService.createUser(regularUserEntity);
        userToken = await userService.loginUser(regularUser.email, regularUser.password);
        regularUser.user_id = (await authService.verify(userToken)).userId;

        const eventEntry: EventEntry = {
            event_id: faker.string.uuid(),
            author: faker.person.firstName(),
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            category: faker.lorem.word(),
            status: 'Draft',
            streamingUrl: faker.internet.url(),
            startAt: faker.date.future(),
            endAt: faker.date.future(),
        };
        testEvent = new Event(eventEntry);
    });

    describe("Feature: Users", () => {
        describe("Création d'un utilisateur", () => {
            test("Doit creer un utilisateur admin avec succès", async () => {
                const response = await request(app).post("/users").send(adminUser);
                expect(response.status).toBe(201);
            });
        });

        describe("Login", () => {
            test("Ne doit pas se connecter avec un email incorrect", async () => {
                const response = await request(app).post("/users/login").send({ email: 'wrong@email.com', password: regularUser.password });
                expect(response.status).toBe(401);
            });

            test("Ne doit pas se connecter avec un mot de passe incorrect", async () => {
                const response = await request(app).post("/users/login").send({ email: regularUser.email, password: 'incorrect-password' });
                expect(response.status).toBe(401);
            });
        });

        describe("Retourner tous les utilisateurs", () => {
            test("Doit retourner tous les utilisateurs avec succès", async () => {
                const response = await request(app).get("/users").set("Authorization", `Bearer ${adminToken}`);
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
            });
        });

        describe("Modifier un utlisateur", () => {
            test("Doit modifier un utilisateur avec succès", async () => {
                const newUsername = faker.internet.username();
                const response = await request(app).put(`/users/${regularUser.user_id}`).send({ username: newUsername });
                expect(response.status).toBe(200);
                expect(response.body.username).toBe(newUsername);
            });
        });

        describe("Supression d'un utilisateur", () => {
            test("Un utlisateur normal ne peut pas supprimer un autre utilisateur", async () => {
                const response = await request(app).delete(`/users/${adminUser.user_id}`).set("Authorization", `Bearer ${userToken}`);
                expect(response.status).toBe(401);
            });

            test("Doit être admin pour supprimer un autre utilisateur", async () => {
                const response = await request(app).delete(`/users/${regularUser.user_id}`).set("Authorization", `Bearer ${adminToken}`);
                expect(response.status).toBe(401);
            });
        });
    });




    describe("Feature: Events", () => {
        let createdEventId: string;

        test("Doit être admin pour créer un event", async () => {
            const response = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(testEvent.properties);
            expect(response.status).toBe(201);
            createdEventId = response.body.event_id;
        });

        test("Un utilsateur normal ne peut pas créer un event", async () => {
            const response = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${userToken}`)
                .send(testEvent.properties);
            expect(response.status).toBe(401);
        });

        test("Doit retourner tous les events", async () => {
            const response = await request(app).get('/events');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });

        test("Un admin peut mettre à jour un event", async () => {
            const updatedEvent = { ...testEvent.properties, title: "Updated Title" };
            const response = await request(app)
                .put(`/events/${createdEventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedEvent);
            expect(response.status).toBe(200);
        });

        test("Utilisateur normal ne doit pas mettre à jour un event", async () => {
            const updatedEvent = { ...testEvent.properties, title: "Updated Title" };
            const response = await request(app)
                .put(`/events/${createdEventId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updatedEvent);
            expect(response.status).toBe(401);
        });

        test("Doit être admin pour supprimer un event", async () => {
            const response = await request(app)
                .delete(`/events/${createdEventId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(204);
        });

        test("Un utilsateur normal ne peut pas supprimer un event", async () => {
            const response = await request(app)
                .delete(`/events/${createdEventId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(401);
        });
    });

    describe("Feature: Favorite", () => {
        test("Un utilisateur connecté peut mettre en favoris", async () => {
            const response = await request(app)
            .post(`/favorites/${testEvent.properties.event_id}`)
            expect(response.status).toBe(201)
        })
    })
});
