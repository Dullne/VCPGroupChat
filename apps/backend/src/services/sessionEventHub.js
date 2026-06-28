class SessionEventHub {
    constructor(options = {}) {
        this.historyLimit = Math.max(1, Number(options.historyLimit || 200));
        this.keepAliveMs = Math.max(1000, Number(options.keepAliveMs || 15000));
        this.clients = new Set();
        this.history = [];
        this.sequence = 0;
    }

    createEvent(type, payload = {}) {
        this.sequence += 1;
        return {
            event_id: String(this.sequence),
            type,
            created_at: new Date().toISOString(),
            ...payload
        };
    }

    publish(type, payload = {}) {
        const event = this.createEvent(type, payload);
        this.history.push(event);
        if (this.history.length > this.historyLimit) {
            this.history.splice(0, this.history.length - this.historyLimit);
        }

        for (const client of [...this.clients]) {
            this.writeEvent(client.res, event);
        }

        return event;
    }

    getEventsAfter(eventId) {
        const normalizedEventId = String(eventId || '').trim();
        if (!normalizedEventId) {
            return [];
        }
        const index = this.history.findIndex(event => String(event.event_id) === normalizedEventId);
        return index >= 0 ? this.history.slice(index + 1) : [];
    }

    subscribe(req, res) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        const client = {
            res,
            keepAlive: setInterval(() => {
                if (!res.writableEnded && !res.destroyed) {
                    res.write(': keepalive\n\n');
                }
            }, this.keepAliveMs)
        };
        this.clients.add(client);

        const lastEventId = req.headers?.['last-event-id'] || req.query?.since || '';
        for (const event of this.getEventsAfter(lastEventId)) {
            this.writeEvent(res, event);
        }

        const cleanup = () => {
            clearInterval(client.keepAlive);
            this.clients.delete(client);
        };
        req.on?.('close', cleanup);
        req.on?.('aborted', cleanup);
        res.on?.('close', cleanup);
        return cleanup;
    }

    writeEvent(res, event) {
        if (res.writableEnded || res.destroyed) {
            return;
        }
        res.write(`id: ${event.event_id}\n`);
        res.write('event: groupchat_event\n');
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    getClientCount() {
        return this.clients.size;
    }

    closeAll() {
        for (const client of [...this.clients]) {
            clearInterval(client.keepAlive);
            if (!client.res.writableEnded && !client.res.destroyed) {
                client.res.end?.();
            }
        }
        this.clients.clear();
    }
}

module.exports = {
    SessionEventHub
};
