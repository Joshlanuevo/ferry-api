import { Vessel } from "../FerrySearch/Vessel";
import { Port } from "../FerrySearch/Port";
import { Route } from "../FerrySearch/Route";
import { ShippingLine } from "../FerrySearch/ShippingLine";
import { VoyageInformation } from "./VoyageInformation";

export type Voyage = {
    id: string;
    departureDateTime: string;
    vesselName: string;
    vessel: Vessel;
    port: Port;
    route: Route;
    duration: string;
    via?: string;
    status: string;
    isBoarding: boolean;
    isPassageValid: boolean;
    isCargoValid: boolean;
    shippingLine: ShippingLine;
    voyageInformation: VoyageInformation;
};