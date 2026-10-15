import { create } from 'zustand';

import type { VideoQuality } from '~/lib/methods/helpers/captureOptionsFor';
import { type ActiveReaction, applyHand, dropHand, type HandMessage, type HandsMap, sweepReactions } from './callDataProtocol';

export type TConferenceLayout = 'grid' | 'spotlight' | 'sidebar';

export type TCameraFacing = 'user' | 'environment';

type TConferenceInteractionStore = {
	hands: HandsMap;
	reactions: ActiveReaction[];
	layout: TConferenceLayout;
	videoQuality: VideoQuality;
	cameraFacing: TCameraFacing;
	speakerOn: boolean;
	applyHandMessage: (identity: string, message: HandMessage, now: number) => void;
	dropParticipantHand: (identity: string) => void;
	addReaction: (reaction: ActiveReaction) => void;
	sweepExpiredReactions: (now: number) => void;
	setLayout: (layout: TConferenceLayout) => void;
	setVideoQuality: (quality: VideoQuality) => void;
	setCameraFacing: (facing: TCameraFacing) => void;
	setSpeakerOn: (speakerOn: boolean) => void;
	reset: () => void;
};

export const useConferenceInteractionStore = create<TConferenceInteractionStore>(set => ({
	hands: {},
	reactions: [],
	layout: 'grid',
	videoQuality: 'auto',
	cameraFacing: 'user',
	speakerOn: true,

	applyHandMessage: (identity, message, now) => set(current => ({ hands: applyHand(current.hands, identity, message, now) })),

	dropParticipantHand: identity => set(current => ({ hands: dropHand(current.hands, identity) })),

	addReaction: reaction => set(current => ({ reactions: [...current.reactions, reaction] })),

	sweepExpiredReactions: now => set(current => ({ reactions: sweepReactions(current.reactions, now) })),

	setLayout: layout => set({ layout }),

	setVideoQuality: videoQuality => set({ videoQuality }),

	setCameraFacing: cameraFacing => set({ cameraFacing }),

	setSpeakerOn: speakerOn => set({ speakerOn }),

	reset: () => set({ hands: {}, reactions: [], cameraFacing: 'user', videoQuality: 'auto', speakerOn: true })
}));
