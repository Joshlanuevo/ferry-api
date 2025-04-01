// Base model for shared functionality
export interface BaseModel {
    [key: string]: any;
  }
  
// Accommodation Type model
  export interface AccommodationType extends BaseModel {
    id: number;
    name: string;
}
  
// Discount Type model
  export interface DiscountType extends BaseModel {
    id: number;
    name: string;
    isVatable: boolean;
}
  
// Contact Info model
  export interface ContactInfo extends BaseModel {
    contactPerson: string;
    address: string;
    mobile: string;
    landLine?: string;
    email: string;
}
  
// Transaction Info model
export interface TransactionInfo extends BaseModel {
    id: string;
    bookingReferenceNumber: string;
    contactInfo: ContactInfo;
    reservationExpiry?: string;
    total: number;
    bookingDate: string;
    status: string;
}
  
// Company model
export interface Company extends BaseModel {
    name: string;
    displayName: string;
    logo: string;
    companyId: string;
}
  
// Voyage model
export interface Voyage extends BaseModel {
    departureDate: string;
    vesselName: string;
    routeCode: string;
    origin: string;
    originId: string;
    destination: string;
    destinationId: string;
    voyageId: string;
}
  
// Charges model
export interface Charges extends BaseModel {
    ticketTotal: number;
    addOnsTotal: number;
    ticketWithAddOn: number;
    terminalFee: number;
    overAllTotal: number;
}
  
// Route Price Group model
export interface RoutePriceGroup extends BaseModel {
    id: string;
    name: string;
}
  
// Model Type model
  export interface ModelType extends BaseModel {
    id: number;
    name: string;
}
  
// Model model
  export interface Model extends BaseModel {
    name: string;
    type: ModelType;
}
  
// Vessel Accommodation model
export interface VesselAccommodation extends BaseModel {
    // Properties would be added based on actual implementation
}
  
// Ticket model - main model for ticket data
export interface Ticket extends BaseModel {
    id: string;
    ticketNumber: string;
    barkotaBookingId: string;
    status: string;
    cotNumber?: string;
    age: string;
    gender: string;
    accommodationId: string;
    accommodationName: string;
    accommodationType: AccommodationType;
    boardingStatus: string;
    passengerName: string;
    discountType: DiscountType;
    transactionInfo: TransactionInfo;
    company: Company;
    voyage: Voyage;
    charges: Charges;
    routePriceGroup: RoutePriceGroup;
    model: Model;
    vesselAccommodation?: VesselAccommodation;
}