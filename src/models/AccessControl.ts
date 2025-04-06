export class AccessControl {
    id: string = '';
    title: string = '';
    description: string = '';
    isSharedWallet: boolean = false;
    allowTopup: boolean = false;
    allowWithdrawal: boolean = false;
    airline: number = 0;
    bus: number = 0;
    hotel: number = 0;
    holiday: number = 0;
    payments: number = 0;
    ferry: number = 0;
    visa: number = 0;
    insurance: number = 0;
    attractions: number = 0;
    passengerCalendar: number = 0;
    markups: number = 0;
    users: number = 0;
    helpCenter: number = 0;
    creditTransfers: number = 0;
    voucher: number = 0;
    visaVoucher: number = 0;
    whitelabelSettings: number = 0;
    pricingPlans: number = 0;
    tourPackagesCreationAdmin: number = 0;
    createCollectiveBooking: number = 0;
    merchantAccountCreation: number = 0;
    deletedAt: string = '';
    createdAt: string = '';
    createdBy: string = '';
    updatedAt: string = '';
    updatedBy: string = '';
    useId: string = '';
    isCommon: boolean = false;
    showWalletBalance: boolean = true;
  
    constructor(data: Partial<AccessControl> = {}) {
      Object.assign(this, data);
    }
  
    toArray(): Record<string, any> {
      return Object.entries(this).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
    }
  
    getDocId(): string {
      return this.id;
    }
  
    getDocIdKey(): string {
      return "id";
    }
  
    getRequiredFields(): string[] {
      return [
        "id",
        "title",
        "description",
        "isSharedWallet",
        "allowTopup",
        "allowWithdrawal",
        "airline",
        "bus",
        "hotel",
        "holiday",
        "payments",
        "ferry",
        "visa",
        "insurance",
        "attractions",
        "markups",
        "users",
        "helpCenter",
        "creditTransfers",
      ];
    }
  
    fieldsForSerialize(): string[] {
      return [];
    }
}