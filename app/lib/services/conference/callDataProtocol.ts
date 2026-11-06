export const REACTION_TTL_MS = 3500;

export type HandMessage = {
	type: 'hand';
	raised: boolean;
	raisedAt?: number;
	rebroadcast?: boolean;
};

export type ReactionMessage = { type: 'reaction'; emoji: string; reactionId?: string };

export type MuteMessage = { type: 'mute'; target?: string };

export type CallDataMessage = HandMessage | ReactionMessage | MuteMessage;

export type HandsMap = Record<string, number>;

export type ActiveReaction = {
	id: string;
	participantId: string;
	emoji: string;
	sentAt: number;
	expiresAt: number;
};

export const encodeMessage = (message: CallDataMessage): Uint8Array<ArrayBuffer> =>
	new TextEncoder().encode(JSON.stringify(message));

export const parseMessage = (payload: Uint8Array): CallDataMessage | null => {
	let message: unknown;
	try {
		message = JSON.parse(new TextDecoder().decode(payload));
	} catch {
		return null;
	}
	if (typeof message !== 'object' || message === null) {
		return null;
	}
	const { type, raised, raisedAt, rebroadcast, emoji, reactionId, target } = message as Record<string, unknown>;
	switch (type) {
		case 'hand':
			return {
				type,
				raised: raised === true,
				raisedAt: typeof raisedAt === 'number' ? raisedAt : undefined,
				rebroadcast: rebroadcast === true
			};
		case 'mute':
			return { type, target: typeof target === 'string' ? target : undefined };
		case 'reaction':
			return emoji && typeof emoji === 'string'
				? { type, emoji, reactionId: typeof reactionId === 'string' ? reactionId : undefined }
				: null;
		default:
			return null;
	}
};

export const applyHand = (hands: HandsMap, identity: string, message: HandMessage, now: number): HandsMap => ({
	...hands,
	[identity]: message.raised ? message.raisedAt || now : 0
});

export const dropHand = (hands: HandsMap, identity: string): HandsMap => {
	if (!(identity in hands)) {
		return hands;
	}
	return Object.fromEntries(Object.entries(hands).filter(([id]) => id !== identity));
};

export const isHandNews = (message: HandMessage, alreadyUp: boolean): boolean =>
	message.raised && !message.rebroadcast && !alreadyUp;

export const orderRaisedHands = (hands: HandsMap): { id: string; raisedAt: number }[] =>
	Object.entries(hands)
		.filter(([, raisedAt]) => raisedAt > 0)
		.map(([id, raisedAt]) => ({ id, raisedAt }))
		.sort((a, b) => a.raisedAt - b.raisedAt);

export const reactionIdFor = (identity: string, now: number): string =>
	`${identity}-${now}-${Math.random().toString(36).slice(2, 6)}`;

export const createReaction = (participantId: string, emoji: string, now: number, reactionId?: string): ActiveReaction => ({
	id: reactionId || reactionIdFor(participantId, now),
	participantId,
	emoji,
	sentAt: now,
	expiresAt: now + REACTION_TTL_MS
});

export const sweepReactions = (reactions: ActiveReaction[], now: number): ActiveReaction[] => {
	const next = reactions.filter(reaction => reaction.expiresAt > now);
	return next.length === reactions.length ? reactions : next;
};
