import { StorageAdapter } from "reactticket-core/types/adapter.types";
import { IssuedTicket } from "reactticket-core/types/ticket.types";
import { AuthService } from "./AuthService";
export declare class TicketService {
    private adapter;
    private authService;
    constructor(adapter: StorageAdapter, authService: AuthService);
    issueTickets(orderId: string): Promise<IssuedTicket[]>;
    deliverTicket(ticketId: string): Promise<void>;
    transferTicket(ticketId: string, toEmail: string, newPersonalization: import("reactticket-core/types/ticket.types").TicketPersonalization): Promise<void>;
}
