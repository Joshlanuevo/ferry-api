export type Accommodation = {
  id: string;
  name: string;
  code: string;
  priceId: string;
  isAircon: boolean;
  isCotRequired: boolean;
  seatType: string;
  remaining: number;
  totalBooked: number;
  totalCapacity: number;
  totalPrice: number;
};