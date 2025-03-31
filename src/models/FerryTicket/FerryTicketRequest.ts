export interface PassengerInfo {
    firstname: string;
    lastname: string;
    mi?: string;
    isDriver: number;
    gender: number;
    birthdate: string;
    idnumber?: string;
    nationality: string;
    discountType: string;
    filenames: string;
  }
  
export interface Passenger {
    passenger: PassengerInfo;
    departurePriceId: string;
    returnPriceId?: string;
    departureCotId?: string;
    returnCotId?: string;
}
  
export interface ContactInfo {
    name: string;
    email: string;
    mobile: string;
    address: string;
}
  
export interface FerryTicketRequest {
    passengers: Passenger[];
    contactInfo: ContactInfo;
    allowPromotionsNotification: number;
    returnPrintUrl: number;
    isServiceFee: number;
}