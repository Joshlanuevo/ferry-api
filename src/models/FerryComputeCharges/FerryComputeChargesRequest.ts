export interface FerryComputeChargesRequest {
    passengerList: Passenger[];
    isServiceFee?: number;
}
  
export interface Passenger {
    passenger: PassengerInfo;
    departurePriceId: string;
    returnPriceId?: string;
    departureCotId?: string;
    returnCotId?: string;
}
  
export interface PassengerInfo {
    firstname: string;
    lastname: string;
    mi?: string | null;
    isDriver?: number;
    gender: number;
    birthdate: string;
    idnumber?: string | null;
    nationality: string;
    discountType?: string;
    filenames?: string;
}