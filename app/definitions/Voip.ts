export type IceServer = {
	urls: string;
	username?: string;
	credential?: string;
};

export interface VoipPayload {
	readonly callId: string;
	readonly caller: string;
	readonly host: string;
	readonly type: string;
	readonly callUUID: string;
}
