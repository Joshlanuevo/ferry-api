import { UserModel } from "../UserModel";
import { GeoIpData } from "../UserSession/GeoIpData";

export interface UserSession {
  session_key: string;
  session_data: UserModel;
  cookies: Record<string, string> | null;
  session_start: string;
  session_expiration: string;
  session_geoip_data?: GeoIpData;
  whitelabel_id?: string;
}

export function isValidSession(session: UserSession): boolean {
  if (!session.session_expiration) return false;
  
  const isExpired = new Date(session.session_expiration) <= new Date();
  const validUserData = session.session_data?.email ? true : false;
  
  return !isExpired && validUserData;
}