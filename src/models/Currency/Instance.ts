import { CurrencyInstanceBase } from "./CurrencyInstanceBase";
import { ISOCurrencyEnums } from "./ISOCurrencyEnums";

export class Instance extends CurrencyInstanceBase {
    static from(value: number | string, currencyType: ISOCurrencyEnums): Instance {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      return new Instance(numericValue, currencyType);
    }
}