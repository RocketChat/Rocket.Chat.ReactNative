export type ContactInfo = {
	id: string;
	name?: string;
	host: string;
};

export type VoipGenericSession = {
	type: 'INCOMING' | 'OUTGOING' | 'ONGOING' | 'ERROR';
	id?: string;
	contact: ContactInfo | null;
	transferedBy?: ContactInfo | null;
	isMuted?: boolean;
	isHeld?: boolean;
	error?: { status?: number; reason: string };
	accept?(): Promise<void>;
	end?(): void;
	mute?(mute?: boolean): void;
	hold?(held?: boolean): void;
	dtmf?(digit: string): void;
};

export type VoipOngoingSession = VoipGenericSession & {
	type: 'ONGOING';
	id: string;
	contact: ContactInfo;
	isMuted: boolean;
	isHeld: boolean;
	end(): void;
	mute(muted?: boolean): void;
	hold(held?: boolean): void;
	dtmf(digit: string): void;
};

export type VoipIncomingSession = VoipGenericSession & {
	type: 'INCOMING';
	id: string;
	contact: ContactInfo;
	transferedBy: ContactInfo | null;
	end(): void;
	accept(): Promise<void>;
};

export type VoipOutgoingSession = VoipGenericSession & {
	type: 'OUTGOING';
	id: string;
	contact: ContactInfo;
	end(): void;
};

export type VoipErrorSession = VoipGenericSession & {
	type: 'ERROR';
	contact: ContactInfo;
	error: { status?: number; reason: string };
	end(): void;
};

export type VoipSession = VoipIncomingSession | VoipOngoingSession | VoipOutgoingSession | VoipErrorSession;

export const isVoipIncomingSession = (session: VoipSession | null | undefined): session is VoipIncomingSession =>
	session?.type === 'INCOMING';

export const isVoipOngoingSession = (session: VoipSession | null | undefined): session is VoipOngoingSession =>
	session?.type === 'ONGOING';

export const isVoipOutgoingSession = (session: VoipSession | null | undefined): session is VoipOutgoingSession =>
	session?.type === 'OUTGOING';

export const isVoipErrorSession = (session: VoipSession | null | undefined): session is VoipErrorSession =>
	session?.type === 'ERROR';
