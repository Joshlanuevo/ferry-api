import { RoundingMode } from "./money";

export const roundNumber = (value: number, roundingMode: RoundingMode = RoundingMode.HALF_UP): number => {
    switch (roundingMode) {
      case RoundingMode.UP:
        return Math.ceil(value);
      case RoundingMode.DOWN:
        return Math.floor(value);
      case RoundingMode.CEILING:
        return value >= 0 ? Math.ceil(value) : Math.floor(value);
      case RoundingMode.FLOOR:
        return value >= 0 ? Math.floor(value) : Math.ceil(value);
      case RoundingMode.HALF_UP:
        return Math.round(value);
      case RoundingMode.HALF_DOWN:
        return value >= 0
          ? (Math.round(value * 2) / 2)
          : -Math.round(Math.abs(value) * 2) / 2;
      case RoundingMode.HALF_EVEN:
        const rounded = Math.round(value);
        const fraction = Math.abs(value) - Math.floor(Math.abs(value));
        if (fraction === 0.5) {
          return rounded % 2 === 0 ? rounded : rounded - 1;
        }
        return rounded;
      default:
        return Math.round(value);
    }
};
  
  // Fixed-point arithmetic to avoid floating-point precision issues
export const add = (a: number, b: number, roundingMode: RoundingMode = RoundingMode.UP): number => {
    const result = a + b;
    return roundNumber(result, roundingMode);
};
  
export const subtract = (a: number, b: number, roundingMode: RoundingMode = RoundingMode.UP): number => {
    const result = a - b;
    return roundNumber(result, roundingMode);
};
  
export const multiply = (a: number, b: number, roundingMode: RoundingMode = RoundingMode.UP): number => {
    const result = a * b;
    return roundNumber(result, roundingMode);
};
  
export const divide = (a: number, b: number, roundingMode: RoundingMode = RoundingMode.UP): number => {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = a / b;
    return roundNumber(result, roundingMode);
};
  
  export const absolute = (value: number): number => {
    return Math.abs(value);
};