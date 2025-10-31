export interface FavoriteEntry {
    favorite_id: string;
    user_id: string;
    event_id: string;
}

export class Favorite {
    public properties: FavoriteEntry;

    constructor(properties: FavoriteEntry){
       this.properties = properties;
    }
}