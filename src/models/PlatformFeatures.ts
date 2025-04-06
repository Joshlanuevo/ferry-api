import { BaseModel } from './BaseModel';

export class PlatformFeatures extends BaseModel {
    airline: boolean = false;
    bus: boolean = false;
    hotel: boolean = false;
    holiday: boolean = false;
    payments: boolean = false;
    ferry: boolean = false;
    attractions: boolean = false;
    visa: boolean = false;
    insurance: boolean = false;
    passengerCalendar: boolean = false;
    helpCenter: boolean = false;
    markups: boolean = true;
    users: boolean = true;
    creditTransfers: boolean = true;
    voucher: boolean = false;
    visaVoucher: boolean = false;
    tourPackagesCreationAdmin: boolean = false;
    createCollectiveBooking: boolean = false;
    merchantAccountCreation: boolean = false;
    pricingPlans: boolean = false;
    bux: boolean = false;
    paymongo: boolean = false;
    api: boolean = false;
    membership: boolean = false;
  
    enableAllAccess(): PlatformFeatures {
      this.airline = true;
      this.bus = true;
      this.hotel = true;
      this.holiday = true;
      this.payments = true;
      this.ferry = true;
      this.attractions = true;
      this.visa = true;
      this.insurance = true;
      this.passengerCalendar = true;
      this.helpCenter = true;
      this.markups = true;
      this.users = true;
      this.creditTransfers = true;
      this.voucher = true;
      this.visaVoucher = true;
      this.tourPackagesCreationAdmin = true;
      this.createCollectiveBooking = true;
      this.merchantAccountCreation = true;
      this.paymongo = true;
      this.membership = true;
      this.api = true;
      this.bux = true;
      return this;
    }
}