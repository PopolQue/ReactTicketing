export declare function isValidEmail(email: string): boolean;
export declare function isValidUsername(username: string): boolean;
export declare function isValidPin(pin: string): boolean;
export declare function validateAdapterSettings(adapterName: string, mode: string | undefined, nodeEnv: string): {
    type: 'error' | 'warn';
    message: string;
} | null;
