import { BasicUserModel } from '../models/BasicUserModel';
import { UserTypes } from '../enums/UserTypes';

export function isAdmin(user?: BasicUserModel | null): boolean {
    if (!user || !user.type) return false;
  
    const type = user.type.toUpperCase();
    return type === UserTypes.ADMIN || type === UserTypes.SUPERADMIN;
}