export class LocalStorageAdapter {
    name = 'LocalStorageAdapter';
    getStorageKey(eventId, key) {
        return `tf_${eventId}_${key}`;
    }
    // Ticket Types
    async getTicketTypes(eventId) {
        const data = localStorage.getItem(this.getStorageKey(eventId, 'ticketTypes'));
        return data ? JSON.parse(data) : [];
    }
    async saveTicketType(eventId, type) {
        const types = await this.getTicketTypes(eventId);
        const index = types.findIndex((t) => t.id === type.id);
        if (index > -1) {
            types[index] = type;
        }
        else {
            types.push(type);
        }
        localStorage.setItem(this.getStorageKey(eventId, 'ticketTypes'), JSON.stringify(types));
    }
    async deleteTicketType(eventId, ticketTypeId) {
        const types = await this.getTicketTypes(eventId);
        const updated = types.filter(t => t.id !== ticketTypeId);
        localStorage.setItem(this.getStorageKey(eventId, 'ticketTypes'), JSON.stringify(updated));
    }
    // Orders
    async createOrder(order) {
        const orders = await this.getAllOrders(order.eventId);
        orders.push(order);
        localStorage.setItem(this.getStorageKey(order.eventId, 'orders'), JSON.stringify(orders));
    }
    async getOrder(orderId) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith('_orders')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const orders = JSON.parse(data);
                    const found = orders.find(o => o.id === orderId);
                    if (found)
                        return found;
                }
            }
        }
        return null;
    }
    async getAllOrders(eventId) {
        const data = localStorage.getItem(this.getStorageKey(eventId, 'orders'));
        return data ? JSON.parse(data) : [];
    }
    async updateOrderStatus(orderId, status) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tf_') && key.endsWith('_orders')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const orders = JSON.parse(data);
                    const index = orders.findIndex(o => o.id === orderId);
                    if (index > -1) {
                        orders[index].status = status;
                        localStorage.setItem(key, JSON.stringify(orders));
                        return;
                    }
                }
            }
        }
    }
    // Tickets
    async getTicket(ticketId) {
        // This is tricky without a mapping of ticketId -> eventId
        // We'll search all events for now
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const tickets = JSON.parse(data);
                    const found = tickets.find(t => t.id === ticketId);
                    if (found)
                        return found;
                }
            }
        }
        return null;
    }
    async getTicketsByOrder(orderId) {
        const results = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const tickets = JSON.parse(data);
                    results.push(...tickets.filter(t => t.orderId === orderId));
                }
            }
        }
        return results;
    }
    async getIssuedTickets(eventId) {
        const data = localStorage.getItem(this.getStorageKey(eventId, 'tickets'));
        return data ? JSON.parse(data) : [];
    }
    async saveTicket(ticket) {
        const key = this.getStorageKey(ticket.eventId, 'tickets');
        const tickets = await this.getIssuedTickets(ticket.eventId);
        tickets.push(ticket);
        localStorage.setItem(key, JSON.stringify(tickets));
    }
    async saveTickets(newTickets) {
        if (newTickets.length === 0)
            return;
        const eventId = newTickets[0].eventId;
        const key = this.getStorageKey(eventId, 'tickets');
        const tickets = await this.getIssuedTickets(eventId);
        tickets.push(...newTickets);
        localStorage.setItem(key, JSON.stringify(tickets));
    }
    async updateTicketStatus(ticketId, status) {
        // Need to find which event this ticket belongs to
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const tickets = JSON.parse(data);
                    const index = tickets.findIndex(t => t.id === ticketId);
                    if (index > -1) {
                        tickets[index].status = status;
                        localStorage.setItem(key, JSON.stringify(tickets));
                        return;
                    }
                }
            }
        }
    }
    async deliverTicket(ticketId, qrPayload) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const tickets = JSON.parse(data);
                    const index = tickets.findIndex(t => t.id === ticketId);
                    if (index > -1) {
                        tickets[index].status = 'delivered';
                        tickets[index].qrPayload = qrPayload;
                        localStorage.setItem(key, JSON.stringify(tickets));
                        return;
                    }
                }
            }
        }
    }
    async transferTicket(ticketId, toEmail, newPersonalization) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const tickets = JSON.parse(data);
                    const index = tickets.findIndex(t => t.id === ticketId);
                    if (index > -1) {
                        const ticket = tickets[index];
                        if (!ticket.transferHistory)
                            ticket.transferHistory = [];
                        ticket.transferHistory.push({
                            fromEmail: ticket.personalization.email,
                            toEmail: toEmail,
                            at: new Date()
                        });
                        ticket.personalization = newPersonalization;
                        localStorage.setItem(key, JSON.stringify(tickets));
                        return;
                    }
                }
            }
        }
    }
    async countIssuedTickets(ticketTypeId, eventId) {
        const tickets = await this.getIssuedTickets(eventId);
        const filtered = tickets.filter(t => t.ticketTypeId === ticketTypeId && t.status !== 'cancelled');
        return filtered.length;
    }
    // Promo Codes
    async getPromoCode(code) {
        const batches = await this.listPromoBatches();
        for (const batch of batches) {
            const codeFound = batch.codes.find(c => c.code === code);
            if (codeFound)
                return codeFound;
        }
        return null;
    }
    async savePromoBatch(batch) {
        const data = localStorage.getItem('tf_promo_batches');
        const batches = data ? JSON.parse(data) : [];
        const index = batches.findIndex(b => b.id === batch.id);
        if (index > -1) {
            batches[index] = batch;
        }
        else {
            batches.push(batch);
        }
        localStorage.setItem('tf_promo_batches', JSON.stringify(batches));
    }
    async incrementPromoUsage(code) {
        const batches = await this.listPromoBatches();
        let updated = false;
        for (const batch of batches) {
            const codeFound = batch.codes.find(c => c.code === code);
            if (codeFound) {
                codeFound.usedCount++;
                updated = true;
                break;
            }
        }
        if (updated) {
            localStorage.setItem('tf_promo_batches', JSON.stringify(batches));
        }
    }
    async listPromoBatches() {
        const data = localStorage.getItem('tf_promo_batches');
        return data ? JSON.parse(data) : [];
    }
    // Scan Events
    async saveScanEvent(scan) {
        const data = localStorage.getItem('tf_scan_events');
        const events = data ? JSON.parse(data) : [];
        events.push(scan);
        localStorage.setItem('tf_scan_events', JSON.stringify(events));
    }
    async getScanEvents(eventId) {
        const data = localStorage.getItem('tf_scan_events');
        const events = data ? JSON.parse(data) : [];
        const eventTickets = await this.getIssuedTickets(eventId);
        const validTicketIds = new Set(eventTickets.map(t => t.id));
        return events.filter(e => validTicketIds.has(e.ticketId));
    }
    // Scan Accounts
    async getScanAccount(accountId) {
        const accounts = await this.listAllScanAccounts();
        return accounts.find(a => a.id === accountId) || null;
    }
    async getScanAccountByUsername(eventId, username) {
        const accounts = await this.listScanAccounts(eventId);
        return accounts.find(a => a.username === username) || null;
    }
    async listScanAccounts(eventId) {
        const accounts = await this.listAllScanAccounts();
        return accounts.filter(a => a.eventId === eventId);
    }
    async listAllScanAccounts() {
        const data = localStorage.getItem('tf_scan_accounts');
        return data ? JSON.parse(data) : [];
    }
    async saveScanAccount(account) {
        const accounts = await this.listAllScanAccounts();
        const index = accounts.findIndex(a => a.id === account.id);
        if (index > -1) {
            accounts[index] = account;
        }
        else {
            accounts.push(account);
        }
        localStorage.setItem('tf_scan_accounts', JSON.stringify(accounts));
    }
    async updateScanAccount(accountId, patch) {
        const accounts = await this.listAllScanAccounts();
        const index = accounts.findIndex(a => a.id === accountId);
        if (index > -1) {
            accounts[index] = { ...accounts[index], ...patch };
            localStorage.setItem('tf_scan_accounts', JSON.stringify(accounts));
        }
    }
    async deleteScanAccount(accountId) {
        const accounts = await this.listAllScanAccounts();
        const updated = accounts.filter(a => a.id !== accountId);
        localStorage.setItem('tf_scan_accounts', JSON.stringify(updated));
    }
    async incrementScanAccountLoginTimestamp(accountId, at) {
        const accounts = await this.listAllScanAccounts();
        const index = accounts.findIndex(a => a.id === accountId);
        if (index > -1) {
            accounts[index].lastLoginAt = at;
            localStorage.setItem('tf_scan_accounts', JSON.stringify(accounts));
        }
    }
}
