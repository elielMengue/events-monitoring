
import { Event } from "../domain/entity.events";
import { type EventRepository } from "../domain/repository.events";

export class InMemoEventRepository implements EventRepository{
    private adapter: Event[] = [];



    create(event: Event): Promise<Event> {
        const createdEvent = new Event(event.properties)
        this.adapter.push(createdEvent);
        return Promise.resolve(createdEvent)
    }

    findById(id: string): Promise<Event | undefined> {
        const event = this.adapter.find(event => event.properties.event_id === id);
        return Promise.resolve(event);

    }

    findAll(): Promise<Event[]> {
        return Promise.resolve(this.adapter);

    }

    update(event: Event, id: string): Promise<Event | null> {
      const index = this.adapter.findIndex(e => e.properties.event_id === id);
      if (index !== -1) {
        this.adapter[index] = event;
        return Promise.resolve(event);
      }
      return Promise.resolve(null);
    }

    delete(id: string): void {
        this.adapter = this.adapter.filter(event => event.properties.event_id !== id);
    }
}