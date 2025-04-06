import { UserData } from "../models/UserData/userData";

export class UserModel implements UserData {
    id!: string;
    userId!: string;
    first_name!: string;
    last_name!: string;
    email!: string;
    mobile_no!: string;
    contact_no!: string;
    username!: string;
    agency_id!: string;
    agency_name!: string;
    company_name!: string;
    registration_no!: string;
    status!: string;
    type!: string;
    country!: string;
    country_name!: string;
    region_name!: string;
    city_name!: string;
    currency!: string;
    address_1!: string;
    address_2!: string;
    pin_code!: string;
    features: any;
    access_level!: string;
    profile_pic!: string;
    created_at!: string;
    updated_at!: string;
    updated_by!: string;
    last_login!: string;
    meta!: any[];
    attachments!: string[];
    tin_number!: string;
    password!: string;
    bcryptPassword!: string;

    constructor(userData: Partial<UserData>) {
        Object.assign(this, userData);
    }
}