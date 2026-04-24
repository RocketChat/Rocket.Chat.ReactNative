export type IceServer = {
	urls: string;
	username?: string;
	credential?: string;
};

export interface VoipPayload {
	readonly callId: string;
	readonly caller: string;
	readonly username: string;
	readonly host: string;
	readonly hostName: string;
	readonly type: string;
	readonly avatarUrl?: string | null;
	readonly createdAt?: string | null;
	readonly notificationId: number;
	readonly voipAcceptFailed?: boolean;
	readonly pendingAccept?: boolean;
}
