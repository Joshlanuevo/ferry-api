export class FerryAuthResponse {
    access_token!: string;
    expires_in!: number;
    token_type!: string;
    scope?: any;
    refresh_token?: string;
    
    constructor(data: Partial<FerryAuthResponse>) {
        Object.assign(this, data);
    }

    toJSON() {
        return {
            access_token: this.access_token,
            expires_in: this.expires_in,
            token_type: this.token_type,
            scope: this.scope,
            refresh_token: this.refresh_token
        };
    }
}