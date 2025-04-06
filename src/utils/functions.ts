export const getValue = <T>(obj: any, path: string, defaultValue?: T): T => {
    const parts = path.split('.');
    let result = obj;
    
    for (const part of parts) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue as T;
      }
      result = result[part];
    }
    
    return (result === undefined || result === null) ? defaultValue as T : result as T;
};

export const isFullArray = (arr: any): boolean => {
    return Array.isArray(arr) && arr.length > 0;
};