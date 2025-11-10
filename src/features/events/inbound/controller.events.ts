
import {Router, type Request, type Response } from "express";
import { EventService } from "../domain/service.events";
import { authMiddleware } from "../../../lib/middleware.auth";
import { AuthService } from "../../../lib/port.auth";
import { Event } from "../domain/entity.events";
import { z } from "zod";
import crypto from "crypto";


const createEventSchema = z.object({
    event_id: z.string().optional(),
    author: z.string().min(1),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1),
    category: z.string().min(1),
    status: z.string().optional(),
    streamingUrl: z.string().url().optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
});

export function EventController(service: EventService, authService: AuthService) : Router{
    const router = Router();

    router.get('/', async(_req: Request, res: Response) => {
       const events = await service.findAllEvents();
       res.json(events.map(e => e.properties));
    });

    router.get('/:id', async(req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const event = await service.findEventById(id as string);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json(event.properties);
        } catch (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.post('/', authMiddleware(authService), async(req: Request, res: Response) =>{
        try {
            const userId = req.user!.userId;
            const parsed = createEventSchema.safeParse(req.body);
            if (!parsed.success) {
                const errorMessages = parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return res.status(400).json({ error: errorMessages });
            }
            const eventData = parsed.data;
            // Generate event_id if not provided
            if (!eventData.event_id) {
                eventData.event_id = crypto.randomUUID();
            }
            const event = new Event(eventData as any);
            const createEvent =  await service.createEvent(userId, event);
            res.status(201).json(createEvent.properties)
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'Unauthorized') {
                    return res.status(403).json({ error: err.message });
                }
                if (err.message.includes('start date') || err.message.includes('title') || err.message.includes('description')) {
                    return res.status(400).json({ error: err.message });
                }
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.put('/:id', authMiddleware(authService), async(req: Request, res: Response) =>{
        try {
            const userId = req.user!.userId;
            const { id } = req.params;

            // Get existing event first
            const existingEvent = await service.findEventById(id as string);
            if (!existingEvent) {
                return res.status(404).json({ error: "Event not found" });
            }

            // Merge update data with existing event, preserving event_id
            const updatedData = {
                ...existingEvent.properties,
                ...req.body,
                event_id: id  // Ensure event_id matches the URL parameter
            };

            const event = new Event(updatedData);
            const updatedEvent = await service.updateEvent(userId, event, id as string);
            if (!updatedEvent) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json(updatedEvent.properties);
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'Unauthorized') {
                    return res.status(403).json({ error: err.message });
                }
                if (err.message.includes('start date')) {
                    return res.status(400).json({ error: err.message });
                }
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

    });

    router.delete('/:id', authMiddleware(authService), async(req: Request, res: Response) =>{
        try {
            const userId = req.user!.userId;
            const {id} = req.params;
            await service.deleteEvent(userId, id as string);
            res.sendStatus(204);
        } catch (err) {
            if (err instanceof Error && err.message === 'Unauthorized') {
                return res.status(403).json({ error: err.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    })

   return router;
}



