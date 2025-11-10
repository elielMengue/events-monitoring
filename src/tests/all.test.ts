import request from 'supertest';
import { describe, test, expect, beforeAll, beforeEach, afterEach } from 'bun:test';
import { faker } from '@faker-js/faker';
import app from '../app/server';
import { type EventEntry, Event } from '../features/events/domain/entity.events';
import { UserService } from '../features/users/domain/service.users';
import { AuthService } from '../lib/port.auth';
import { User } from '../features/users/domain/entity.users';
import { resendAdapter } from '../features/messaging';
import { InMemoryUserRepository } from '@/features/users/outbound/adapter.users'
import { InMemoEventRepositorySingleton } from '@/features/events/outbound/adapter.events';
import { InMemoFavoriteRepositorySingleton } from '@/features/favorites/outbound/adapter.favorite';
//import { DrizzleUserRepository } from '@/features/
// users/outbound/users.drizzle';


describe("Tests de fonctionnalité", () => {
    let authService: AuthService;
    let userService: UserService;


    beforeAll(() => {
        // Use the same secret as the app will use from env
        const secret = process.env.JWT_SECRET || 'secret';
        authService = new AuthService(secret);
        // Use the singleton repository so data is shared with the app
        userService = new UserService(InMemoryUserRepository, authService, resendAdapter);
    });

    beforeEach(() => {
        // Clear all repositories before each test to prevent data leakage
        InMemoryUserRepository.clear();
        InMemoEventRepositorySingleton.clear();
        InMemoFavoriteRepositorySingleton.clear();
    });

    describe("Feature: Users", () => {
        let adminUser: any;
        let regularUser: any;
        let adminToken: string;
        let userToken: string;

        beforeEach(async () => {
          
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

            // Regular user
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
        });

        describe("Création d'un utilisateur", () => {
            test("Doit créer un utilisateur avec succès", async () => {
                const newUser = {
                    email: faker.internet.email(),
                    username: faker.internet.username(),
                    password: faker.internet.password(),
                    role: 'member'
                };

                const response = await request(app)
                    .post("/users")
                    .send(newUser);

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('user_id');
                expect(response.body.email).toBe(newUser.email);
                expect(response.body.username).toBe(newUser.username);
                expect(response.body).not.toHaveProperty('password');
            });

            test("Doit rejeter un email invalide", async () => {
                const invalidUser = {
                    email: 'invalid-email',
                    username: faker.internet.username(),
                    password: faker.internet.password(),
                    role: 'member'
                };

                const response = await request(app)
                    .post("/users")
                    .send(invalidUser);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('email');
            });

            test("Doit rejeter un mot de passe faible", async () => {
                const weakPasswordUser = {
                    email: faker.internet.email(),
                    username: faker.internet.username(),
                    password: '123',
                    role: 'member'
                };

                const response = await request(app)
                    .post("/users")
                    .send(weakPasswordUser);

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('password');
            });

            test("Doit rejeter un email déjà utilisé", async () => {
                const response = await request(app)
                    .post("/users")
                    .send(adminUser);

                expect(response.status).toBe(409);
                expect(response.body.error).toContain('already exists');
            });
        });

        describe("Authentification", () => {
            test("Doit se connecter avec des identifiants valides", async () => {
                const response = await request(app)
                    .post("/users/login")
                    .send({
                        email: regularUser.email,
                        password: regularUser.password
                    });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('token');
                expect(typeof response.body.token).toBe('string');
            });

            test("Ne doit pas se connecter avec un email incorrect", async () => {
                const response = await request(app)
                    .post("/users/login")
                    .send({
                        email: 'wrong@email.com',
                        password: regularUser.password
                    });

                expect(response.status).toBe(401);
                expect(response.body.error).toBeDefined();
            });

            test("Ne doit pas se connecter avec un mot de passe incorrect", async () => {
                const response = await request(app)
                    .post("/users/login")
                    .send({
                        email: regularUser.email,
                        password: 'incorrect-password'
                    });

                expect(response.status).toBe(401);
                expect(response.body.error).toBeDefined();
            });

            test("Doit rejeter une connexion sans email", async () => {
                const response = await request(app)
                    .post("/users/login")
                    .send({ password: regularUser.password });

                expect(response.status).toBe(400);
            });
        });

        describe("Liste des utilisateurs", () => {
            test("Un admin peut lister tous les utilisateurs", async () => {
                const response = await request(app)
                    .get("/users")
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThanOrEqual(2);
            });

            test("Un utilisateur normal ne peut pas lister les utilisateurs", async () => {
                const response = await request(app)
                    .get("/users")
                    .set("Authorization", `Bearer ${userToken}`);

                expect(response.status).toBe(403);
            });

            test("Doit rejeter une requête sans authentification", async () => {
                const response = await request(app).get("/users");
                expect(response.status).toBe(401);
            });
        });

        describe("Modification d'utilisateur", () => {
            test("Un utilisateur peut modifier son propre profil", async () => {
                const newUsername = faker.internet.username();
                const response = await request(app)
                    .put(`/users/${regularUser.user_id}`)
                    .set("Authorization", `Bearer ${userToken}`)
                    .send({ username: newUsername });

                expect(response.status).toBe(200);
                expect(response.body.username).toBe(newUsername);
            });

            test("Un utilisateur ne peut pas modifier le profil d'un autre", async () => {
                const response = await request(app)
                    .put(`/users/${adminUser.user_id}`)
                    .set("Authorization", `Bearer ${userToken}`)
                    .send({ username: 'hacker' });

                expect(response.status).toBe(403);
            });

            test("Un admin peut modifier n'importe quel profil", async () => {
                const newUsername = faker.internet.username();
                const response = await request(app)
                    .put(`/users/${regularUser.user_id}`)
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ username: newUsername });

                expect(response.status).toBe(200);
                expect(response.body.username).toBe(newUsername);
            });
        });

        describe("Suppression d'utilisateur", () => {
            test("Un admin peut supprimer un utilisateur", async () => {
                const response = await request(app)
                    .delete(`/users/${regularUser.user_id}`)
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(response.status).toBe(204);
            });

            test("Un utilisateur normal ne peut pas supprimer un autre utilisateur", async () => {
                const response = await request(app)
                    .delete(`/users/${adminUser.user_id}`)
                    .set("Authorization", `Bearer ${userToken}`);

                expect(response.status).toBe(403);
            });

            test("Un utilisateur peut supprimer son propre compte", async () => {
                const response = await request(app)
                    .delete(`/users/${regularUser.user_id}`)
                    .set("Authorization", `Bearer ${userToken}`);

                expect(response.status).toBe(204);
            });
        });
    });

    describe("Feature: Events", () => {
        let adminToken: string;
        let userToken: string;
        let createdEventIds: string[] = [];

        beforeEach(async () => {
            // Créer des utilisateurs pour les events
            const admin = new User({
                email: faker.internet.email(),
                username: faker.internet.username(),
                password: faker.internet.password(),
                role: 'admin'
            });
            await userService.createUser(admin);
            adminToken = await userService.loginUser(admin.email, admin.password);

            const user = new User({
                email: faker.internet.email(),
                username: faker.internet.username(),
                password: faker.internet.password(),
                role: 'member'
            });
            await userService.createUser(user);
            userToken = await userService.loginUser(user.email, user.password);
        });

        afterEach(async () => {
            // Nettoyer les events créés
            for (const eventId of createdEventIds) {
                await request(app)
                    .delete(`/events/${eventId}`)
                    .set('Authorization', `Bearer ${adminToken}`);
            }
            createdEventIds = [];
        });

        // Helper function
        async function createTestEvent(token: string) {
            const startDate = faker.date.future();
            const endDate = new Date(startDate.getTime() + 3600000); 

            const eventData: EventEntry = {
                event_id: faker.string.uuid(),
                author: faker.person.firstName(),
                title: faker.lorem.sentence(),
                description: faker.lorem.paragraph(),
                category: faker.lorem.word(),
                status: 'Draft',
                streamingUrl: faker.internet.url(),
                startAt: startDate,
                endAt: endDate,
            };

            const response = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${token}`)
                .send(eventData);

            if (response.status === 201) {
                createdEventIds.push(response.body.event_id);
            }

            return response;
        }

        describe("Création d'événements", () => {
            test("Un admin peut créer un event", async () => {
                const response = await createTestEvent(adminToken);
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('event_id');
            });

            test("Un utilisateur normal ne peut pas créer un event", async () => {
                const response = await createTestEvent(userToken);
                expect(response.status).toBe(403);
            });

            test("Doit rejeter un event sans titre", async () => {
                const invalidEvent = {
                    author: faker.person.firstName(),
                    title: '', // Titre vide
                    description: faker.lorem.paragraph(),
                };

                const response = await request(app)
                    .post('/events')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(invalidEvent);

                expect(response.status).toBe(400);
            });
        });

        describe("Liste et consultation d'événements", () => {
            test("Doit retourner tous les events (public)", async () => {
                await createTestEvent(adminToken);
                await createTestEvent(adminToken);

                const response = await request(app).get('/events');

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Array);
                expect(response.body.length).toBeGreaterThanOrEqual(2);
            });

            test("Doit retourner un event spécifique", async () => {
                const createResponse = await createTestEvent(adminToken);
                const eventId = createResponse.body.event_id;

                const response = await request(app).get(`/events/${eventId}`);

                expect(response.status).toBe(200);
                expect(response.body.event_id).toBe(eventId);
            });

            test("Doit retourner 404 pour un event inexistant", async () => {
                const response = await request(app).get('/events/non-existent-id');
                expect(response.status).toBe(404);
            });
        });

        describe("Mise à jour d'événements", () => {
            test("Un admin peut mettre à jour un event", async () => {
                const createResponse = await createTestEvent(adminToken);
                const eventId = createResponse.body.event_id;

                const updatedData = { title: "Updated Title" };
                const response = await request(app)
                    .put(`/events/${eventId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(updatedData);

                expect(response.status).toBe(200);
                expect(response.body.title).toBe("Updated Title");
            });

            test("Un utilisateur normal ne peut pas mettre à jour un event", async () => {
                const createResponse = await createTestEvent(adminToken);
                const eventId = createResponse.body.event_id;

                const updatedData = { title: "Hacked Title" };
                const response = await request(app)
                    .put(`/events/${eventId}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(updatedData);

                expect(response.status).toBe(403);
            });
        });

        describe("Suppression d'événements", () => {
            test("Un admin peut supprimer un event", async () => {
                const createResponse = await createTestEvent(adminToken);
                const eventId = createResponse.body.event_id;

                const response = await request(app)
                    .delete(`/events/${eventId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(204);

                // Vérifier que l'event n'existe plus
                const getResponse = await request(app).get(`/events/${eventId}`);
                expect(getResponse.status).toBe(404);
            });

            test("Un utilisateur normal ne peut pas supprimer un event", async () => {
                const createResponse = await createTestEvent(adminToken);
                const eventId = createResponse.body.event_id;

                const response = await request(app)
                    .delete(`/events/${eventId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(403);
            });
        });
    });

    describe("Feature: Favorites", () => {
        let userToken: string;
        let eventId: string;

        beforeEach(async () => {
            // Créer un utilisateur
            const user = new User({
                email: faker.internet.email(),
                username: faker.internet.username(),
                password: faker.internet.password(),
                role: 'member'
            });
            await userService.createUser(user);
            userToken = await userService.loginUser(user.email, user.password);

            // Créer un event
            const admin = new User({
                email: faker.internet.email(),
                username: faker.internet.username(),
                password: faker.internet.password(),
                role: 'admin'
            });
            await userService.createUser(admin);
            const adminToken = await userService.loginUser(admin.email, admin.password);

            const startDate = faker.date.future();
            const endDate = new Date(startDate.getTime() + 3600000); // 1 hour after start

            const eventResponse = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    event_id: faker.string.uuid(),
                    title: faker.lorem.sentence(),
                    author: faker.person.firstName(),
                    description: faker.lorem.paragraph(),
                    category: faker.lorem.word(),
                    status: 'Published',
                    streamingUrl: faker.internet.url(),
                    startAt: startDate,
                    endAt: endDate,
                });

            eventId = eventResponse.body.event_id;
        });

        test("Un utilisateur connecté peut mettre en favoris", async () => {
            const response = await request(app)
                .post(`/favorites/${eventId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('favorite_id');
            expect(response.body.event_id).toBe(eventId);
        });

        test("Un utilisateur non connecté ne peut pas mettre en favoris", async () => {
            const response = await request(app)
                .post(`/favorites/${eventId}`);

            expect(response.status).toBe(401);
        });

        test("Un utilisateur peut retirer un favoris", async () => {
            // Ajouter aux favoris
            const addResponse = await request(app)
                .post(`/favorites/${eventId}`)
                .set('Authorization', `Bearer ${userToken}`);

            const favoriteId = addResponse.body.favorite_id;

            // Retirer des favoris
            const removeResponse = await request(app)
                .delete(`/favorites/${favoriteId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(removeResponse.status).toBe(204);
        });

        test("Un utilisateur peut lister ses favoris", async () => {
            // Ajouter plusieurs favoris
            await request(app)
                .post(`/favorites/${eventId}`)
                .set('Authorization', `Bearer ${userToken}`);

            const response = await request(app)
                .get('/favorites')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });

        test("Ne peut pas ajouter le même event en favoris deux fois", async () => {
            // Premier ajout
            await request(app)
                .post(`/favorites/${eventId}`)
                .set('Authorization', `Bearer ${userToken}`);

            // Deuxième ajout
            const response = await request(app)
                .post(`/favorites/${eventId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('already');
        });
    });
});