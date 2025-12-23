import { GameDate } from '../types';
import { compareDates } from './dateService';

export enum EventType {
    GAME = 'GAME',
    PRACTICE = 'PRACTICE',
    RECRUITING = 'RECRUITING',
    TRAINING = 'TRAINING',
    SEASON_TRANSITION = 'SEASON_TRANSITION',
    SIGNING_DAY = 'SIGNING_DAY',
    TOURNAMENT_ROUND = 'TOURNAMENT_ROUND',
    NBA_GAME = 'NBA_GAME',
    NBA_DRAFT = 'NBA_DRAFT',
    OFFSEASON_TASK = 'OFFSEASON_TASK'
}

export interface GameEvent {
    id: string;
    type: EventType;
    date: GameDate;
    label: string;
    payload?: any;
    processed: boolean;
}

export class EventQueue {
    private events: GameEvent[];

    constructor(initialEvents: GameEvent[] = []) {
        this.events = [...initialEvents].sort((a, b) => compareDates(a.date, b.date));
    }

    public add(event: GameEvent) {
        // Insert maintaining sort order
        const index = this.events.findIndex(e => compareDates(e.date, event.date) > 0);
        if (index === -1) {
            this.events.push(event);
        } else {
            this.events.splice(index, 0, event);
        }
    }

    public addBatched(newEvents: GameEvent[]) {
        this.events = [...this.events, ...newEvents].sort((a, b) => compareDates(a.date, b.date));
    }

    public peekNext(): GameEvent | null {
        return this.events.find(e => !e.processed) || null;
    }
    
    public getPendingEvents(): GameEvent[] {
        return this.events.filter(e => !e.processed);
    }
    
    public getEventsForDate(date: GameDate): GameEvent[] {
        return this.events.filter(e => compareDates(e.date, date) === 0 && !e.processed);
    }

    public markProcessed(eventId: string) {
        const evt = this.events.find(e => e.id === eventId);
        if (evt) evt.processed = true;
    }
    
    public clearProcessed() {
        this.events = this.events.filter(e => !e.processed);
    }

    // Serialization helper
    public toJSON() {
        return this.events;
    }
    
    static fromJSON(data: GameEvent[]): EventQueue {
        return new EventQueue(data);
    }
}
