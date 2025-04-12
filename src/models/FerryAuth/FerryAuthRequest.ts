import { getFerryCredentials } from "../../config/ferryApiConfig";

export class FerryAuthRequest {
    grant_type: string = "client_credentials";
    client_id: string;
    client_secret: string;

    constructor(data: Partial<FerryAuthRequest> = {}) {
        const { client_id, client_secret } = getFerryCredentials();
        this.client_id = client_id ?? (() => { throw new Error("client_id is required"); })();
        this.client_secret = client_secret ?? (() => { throw new Error("client_secret is required"); })();
        
        // Similar to fill() in BaseModel
        Object.assign(this, data);
    }

    toJSON() {
        return {
            grant_type: this.grant_type,
            client_id: this.client_id,
            client_secret: this.client_secret
        };
    }
}