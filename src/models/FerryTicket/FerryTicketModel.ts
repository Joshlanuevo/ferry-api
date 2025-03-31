export interface FerryTicketModel {
    transactionInfo: {
      bookingReferenceNumber: string;
      [key: string]: any;
    };
    [key: string]: any;
}