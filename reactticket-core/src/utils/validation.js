export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function isValidUsername(username) {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
}
export function isValidPin(pin) {
    return /^[0-9]{4,8}$/.test(pin);
}
export function validateAdapterSettings(adapterName, mode, nodeEnv) {
    if (nodeEnv === 'production' &&
        adapterName === 'LocalStorageAdapter' &&
        (mode === 'scanner' || mode === 'admin')) {
        return {
            type: 'error',
            message: `LocalStorageAdapter is not supported in production for '${mode}' mode. Please use RestAdapter or another production-ready adapter.`
        };
    }
    if (nodeEnv === 'development' &&
        adapterName === 'LocalStorageAdapter' &&
        (mode === 'scanner' || mode === 'admin')) {
        return {
            type: 'warn',
            message: `Using LocalStorageAdapter in '${mode}' mode. This is not suitable for production.`
        };
    }
    return null;
}
