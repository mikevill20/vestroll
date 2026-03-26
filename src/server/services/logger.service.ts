export class Logger {
    static info(message: string, context?: Record<string, unknown>) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ level: "info", message, ...context }));
    }

    static error(message: string, context?: Record<string, unknown>) {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify({ level: "error", message, ...context }));
    }

    static warn(message: string, context?: Record<string, unknown>) {
        // eslint-disable-next-line no-console
        console.warn(JSON.stringify({ level: "warn", message, ...context }));
    }

    static debug(message: string, context?: Record<string, unknown>) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug(JSON.stringify({ level: "debug", message, ...context }));
        }
    }
}
