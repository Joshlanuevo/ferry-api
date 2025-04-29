export interface FerryTicketResponse {
    printUrl?: string;
    [key: string]: any;
    meta: {
      requestTimestamp: string;
    };
}