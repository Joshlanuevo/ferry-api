import { VoyageInfo } from "./VoyageInfo";

export type FerrySearchResponse = {
    data: VoyageInfo[];
    meta?: {
        totalResults: number;
        requestTimestamp: string;
    };
}