import { ISOCurrencyEnums } from "./ISOCurrencyEnums";

export class CurrencyInstanceBase {
    protected value: number;
    protected currencyType: ISOCurrencyEnums;
  
    constructor(value: number, currencyType: ISOCurrencyEnums) {
      this.value = value;
      this.currencyType = currencyType;
    }
  
    getValue(): number {
      return this.value;
    }
  
    getCurrencyType(): ISOCurrencyEnums {
      return this.currencyType;
    }
  
    toJSON() {
      return this.value;
    }
}