

export interface EventEntry {
    event_id: string;
    author: string;
    title: string;
    description: string;
    category: string;
    status: string; 
    streamingUrl?: string;
    startAt: Date;
    endAt: Date;
}


export class Event {
    public properties: EventEntry;

    constructor(properties: EventEntry){
       this.properties = properties;
    }


}




