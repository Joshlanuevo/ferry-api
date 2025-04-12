export function isFullArray(value: any): boolean {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return false;
}

export function getValue(obj: any, path: string, defaultValue: any = null): any {
    return path.split('.').reduce((o, i) => (o && o[i] !== undefined) ? o[i] : defaultValue, obj);
}