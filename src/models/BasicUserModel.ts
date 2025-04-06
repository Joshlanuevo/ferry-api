export interface BasicUserModel {
    id: string;
    type: string;
    currency: string;
    agency_id?: string;
    country_name: string;
    region_name: string;
    access_level?: string;
    userId: string;
}