export declare function generateHMAC(key: CryptoKey, data: string): Promise<ArrayBuffer>;
export declare function signToken(header: object, payload: object, key: CryptoKey): Promise<string>;
export declare function verifyToken(token: string, key: CryptoKey): Promise<boolean>;
