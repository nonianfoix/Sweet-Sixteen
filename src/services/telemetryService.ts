// services/telemetryService.ts

export const logTelemetryEvent = (eventName: string, data: any) => {
    console.log(`[TELEMETRY] ${eventName}`, JSON.stringify(data, null, 2));
};
