import { Ticket } from "./Ticket";

export interface FerrySearchTicketsResponse {
    data: Ticket[];
    meta: {
      totalResults: number;
      requestTimestamp: string;
      trackingId: string;
    };
}