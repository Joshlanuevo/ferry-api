import { UserTypes } from '../enums/UserTypes';
import { UserModel } from '../models/UserModel';

export function isAdmin(user?: UserModel | null): boolean {
    if (!user || !user.type) return false;
  
    return user.type === UserTypes.ADMIN || user.type === UserTypes.SUPERADMIN;
}