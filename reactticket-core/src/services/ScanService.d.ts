import { StorageAdapter } from "../types/adapter.types";
import { ScanEvent, AnalyticsSummary } from "../types/scan.types";
import { AuthService } from "./AuthService";
import { ScanSession } from "../types/auth.types";
export declare class ScanService {
    private adapter;
    private authService;
    constructor(adapter: StorageAdapter, authService: AuthService);
    validateTicket(payload: string, session: ScanSession, eventId: string): Promise<ScanEvent>;
    getAnalytics(eventId: string): Promise<AnalyticsSummary>;
    private _calculateScanVelocity;
}
