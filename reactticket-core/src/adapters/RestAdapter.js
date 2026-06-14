export class RestAdapter {
    config;
    name = 'RestAdapter';
    constructor(config) {
        this.config = config;
    }
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.config.authToken() ? { Authorization: `Bearer ${this.config.authToken()}` } : {}),
            ...options.headers,
        };
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, { ...options, headers });
        if (response.status === 401 && this.config.onUnauthorized) {
            this.config.onUnauthorized();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        return response.json();
    }
    // Ticket Types
    async getTicketTypes(eventId) {
        return this.request(`/events/${eventId}/ticket-types`);
    }
    async saveTicketType(eventId, type) {
        await this.request(`/events/${eventId}/ticket-types`, {
            method: 'POST',
            body: JSON.stringify(type),
        });
    }
    async deleteTicketType(eventId, ticketTypeId) {
        await this.request(`/events/${eventId}/ticket-types/${ticketTypeId}`, { method: 'DELETE' });
    }
    // Orders
    async createOrder(order) {
        await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        });
    }
    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }
    async updateOrderStatus(orderId, status) {
        await this.request(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }
    // Tickets
    async getTicket(ticketId) {
        return this.request(`/tickets/${ticketId}`);
    }
    async getTicketsByOrder(orderId) {
        return this.request(`/orders/${orderId}/tickets`);
    }
    async getIssuedTickets(eventId) {
        return this.request(`/events/${eventId}/tickets`);
    }
    async saveTicket(ticket) {
        await this.request(`/tickets`, {
            method: 'POST',
            body: JSON.stringify(ticket),
        });
    }
    async saveTickets(tickets) {
        await this.request(`/tickets/batch`, {
            method: 'POST',
            body: JSON.stringify(tickets),
        });
    }
    async updateTicketStatus(ticketId, status) {
        await this.request(`/tickets/${ticketId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }
    async deliverTicket(ticketId, qrPayload) {
        await this.request(`/tickets/${ticketId}/deliver`, {
            method: 'POST',
            body: JSON.stringify({ qrPayload }),
        });
    }
    async transferTicket(ticketId, toEmail, newPersonalization) {
        await this.request(`/tickets/${ticketId}/transfer`, {
            method: 'POST',
            body: JSON.stringify({ toEmail, newPersonalization }),
        });
    }
    async countIssuedTickets(ticketTypeId, eventId) {
        const res = await this.request(`/ticket-types/${ticketTypeId}/issued-count`);
        return res.count;
    }
    // Promo Codes
    async getPromoCode(code) {
        return this.request(`/promo-codes/${code}`);
    }
    async savePromoBatch(batch) {
        await this.request('/promo-batches', {
            method: 'POST',
            body: JSON.stringify(batch),
        });
    }
    async listPromoBatches() {
        return this.request(`/promo-batches`);
    }
    async incrementPromoUsage(code) {
        await this.request(`/promo-codes/${code}/increment`, { method: 'POST' });
    }
    // Scan Events
    async saveScanEvent(scan) {
        await this.request('/scan-events', {
            method: 'POST',
            body: JSON.stringify(scan),
        });
    }
    async getScanEvents(eventId) {
        return this.request(`/events/${eventId}/scan-events`);
    }
    // Scan Accounts
    async getScanAccount(accountId) {
        return this.request(`/scan-accounts/${accountId}`);
    }
    async getScanAccountByUsername(eventId, username) {
        return this.request(`/events/${eventId}/scan-accounts/by-username/${username}`);
    }
    async listScanAccounts(eventId) {
        return this.request(`/events/${eventId}/scan-accounts`);
    }
    async saveScanAccount(account) {
        await this.request('/scan-accounts', {
            method: 'POST',
            body: JSON.stringify(account),
        });
    }
    async updateScanAccount(accountId, patch) {
        await this.request(`/scan-accounts/${accountId}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        });
    }
    async deleteScanAccount(accountId) {
        await this.request(`/scan-accounts/${accountId}`, { method: 'DELETE' });
    }
    async incrementScanAccountLoginTimestamp(accountId, at) {
        await this.request(`/scan-accounts/${accountId}/login`, {
            method: 'POST',
            body: JSON.stringify({ at }),
        });
    }
}
