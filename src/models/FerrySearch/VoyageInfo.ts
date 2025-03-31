import { Passage } from './Passage';
import { Voyage } from './Voyage';

export type VoyageInfo = {
  passageRemarks: string;
  priceGroups: Passage[];
  voyage: Voyage;
  cargo?: any;
  cargoRemarks?: string;
};