import { ISOCurrencyEnums } from '../models/Currency/ISOCurrencyEnums';

export enum RoundingMode {
  UP,
  DOWN,
  CEILING,
  FLOOR,
  HALF_UP,
  HALF_DOWN,
  HALF_EVEN
}

export interface MoneyInterface {
  getAmount(): number;
  getCurrency(): ISOCurrencyEnums;
  plus(money: MoneyInterface, roundingMode?: RoundingMode): MoneyInterface;
  minus(money: MoneyInterface, roundingMode?: RoundingMode): MoneyInterface;
  multipliedBy(factor: number, roundingMode?: RoundingMode): MoneyInterface;
  dividedBy(divisor: number, roundingMode?: RoundingMode): MoneyInterface;
  abs(): MoneyInterface;
}

export interface CurrencyInterface {
  getValue(): number;
  getCurrency(): ISOCurrencyEnums;
  display(): string;
  getMoney(): MoneyInterface;
  toNewCurrency(currency: ISOCurrencyEnums, rate?: number): CurrencyInterface;
}

export interface ExchangeRateProviderInterface {
  setExchangeRate(fromCurrency: string, toCurrency: string, rate: number): void;
  getExchangeRate(fromCurrency: string, toCurrency: string): number;
}

export interface CurrencyConverterInterface {
  convert(money: MoneyInterface, toCurrency: string, roundingMode?: RoundingMode): MoneyInterface;
}

export interface CurrencyInstanceInterface extends CurrencyInterface {
  plus(other: CurrencyInstanceInterface): CurrencyInstanceInterface;
  minus(other: CurrencyInstanceInterface): CurrencyInstanceInterface;
  multipliedBy(factor: number): CurrencyInstanceInterface;
  dividedBy(factor: number): CurrencyInstanceInterface;
  abs(): CurrencyInstanceInterface;
  isSameCurrency(other: CurrencyInstanceInterface): boolean;
  autoConvertTransactionCurrency(other: CurrencyInstanceInterface): CurrencyInstanceInterface;
}

export interface ExchangeRateApiResponse {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    timestamp: number;
    rate: number;
  };
  date: string;
  result: number;
}