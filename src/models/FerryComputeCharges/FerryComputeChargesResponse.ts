export interface FerryComputeChargesResponse {
    cargoTotal: number;
    arrastreTotal: number;
    docstamp: number;
    driverTotal: number;
    barkotaFee: number;
    gatewayFee: number;
    serviceCharge: number;
    terminalFee: number;
    ticketTotal: number;
    outletServiceFee: number;
    total: number;
    diffAmount?: number;
    
    // Metadata for the response
    meta?: {
      requestTimestamp: string;
    };
}
  
export interface AddOns {
    meal: number;
}