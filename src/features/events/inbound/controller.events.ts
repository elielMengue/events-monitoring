
import {Router, type Request, type Response } from "express";
import { EventService } from "../domain/service.events";
import { authMiddleware } from "../../../lib/middleware.auth";
import { AuthService } from "../../../lib/port.auth";


const router = Router();

export function EventController(service: EventService, authService: AuthService) : Router{

    router.get('/', async(_req: Request, res: Response) => {
       const events = await service.findAllEvents();
       res.json(events);
    });

    router.post('/', authMiddleware(authService), async(req: Request, res: Response) =>{
        const userId = req.user!.userId;
        const event =  req.body;
        const createEvent =  await service.createEvent(userId, event);
        res.status(201).json(createEvent)
    });

    router.put('/:id', authMiddleware(authService), async(req: Request, res: Response) =>{
        const userId = req.user!.userId;
        const { id } = req.params;
        const event = req.body;
        const updatedEvent = await service.updateEvent(userId, event, id as string);
        res.json(updatedEvent);

    });

    router.delete('/:id', authMiddleware(authService), async(req: Request, res: Response) =>{
        const userId = req.user!.userId;
        const {id} = req.params;
        await service.deleteEvent(userId, id as string);
        res.sendStatus(204);
    })

   return router;
}



