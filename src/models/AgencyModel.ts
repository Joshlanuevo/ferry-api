import { BaseModelWithDB } from "./BaseModelWithDB";
import { PlatformFeatures } from "./PlatformFeatures";
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { AttachmentDocuments } from './Includes/AttachmentDocuments';
import { ISOCurrencyEnums } from './Currency/ISOCurrencyEnums';

export class AgencyModel extends BaseModelWithDB {
    id!: string;
    isWhitelabel: boolean = false;
    companyName!: string;
    cityName!: string;
    regionName!: string;
    country!: string;
    salesPersonName!: string;
    registeredDate!: string;
    activatedDate?: string;
    remainingAmount!: number;
    email!: string;
    contactNo!: string;
    mobileNo!: string;
    address1!: string;
    address2!: string;
    pinCode!: string;
    tinNumber!: string;
    registrationNo!: string;
    brandLogo!: string;
    packageAvail!: string;
    masteragentId!: string;
    features!: PlatformFeatures;
    attachments!: AttachmentDocuments[];
    currency: ISOCurrencyEnums = ISOCurrencyEnums.PHP;
  
    constructor(data: Partial<AgencyModel> = {}) {
      super(data);
      this.currency = this.currency || ISOCurrencyEnums.PHP;
      this.collection = FirebaseCollections.AGENCIES;
    }
  
    protected transformers(key: string, value: any): any {
      if (key === 'attachments') {
        if (!this.isFullArray(value)) return [];
        return value.map((attachment: any) => new AttachmentDocuments(attachment));
      } else if (key === 'currency') {
        if (!value) return this.currency;
        return value as ISOCurrencyEnums;
      } else if (key === 'features') {
        if (!this.isFullArray(value)) {
          value = {};
        }
        return new PlatformFeatures(value);
      }
      return value;
    }
  
    getDocId(): string {
      return this.id;
    }
  
    getRequiredFields(): string[] {
      return [
        "id",
        "companyName",
        "cityName",
        "regionName",
        "country",
        "salesPersonName",
        "registeredDate",
        "email",
        "contactNo",
        "mobileNo",
        "address1",
        "pinCode",
        "tinNumber",
        "features",
      ];
    }
}  