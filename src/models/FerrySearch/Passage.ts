import { Accommodation } from "./Accommodation";

export type Passage = {
  id: string;
  name: string;
  accommodations: Accommodation[];
};