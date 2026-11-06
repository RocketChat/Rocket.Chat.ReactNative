import { create } from 'zustand';

import type { VideoQuality } from '~/lib/methods/helpers/captureOptionsFor';
import type { TCameraFacing } from '~/lib/methods/helpers/cameraSourceFor';
import { type ActiveReaction, applyHand, dropHand, type HandMessage, type HandsMap, sweepReactions } from './callDataProtocol';

export type TConferenceLayout = 'grid' | 'spotlight' | 'sidebar';

type TConferenceInteractionStore = {
	hands: HandsMap;
	reactions: ActiveReaction[];
	layout: TConferenceLayout;
	videoQuality: VideoQuality;
	cameraFacing: TCameraFacing;
	cameraDeviceId: string | undefined;
	audioOutput: string;
	applyHandMessage: (identity: string, message: HandMessage, now: number) => void;
	dropParticipantHand: (identity: string) => void;
	addReaction: (reaction: ActiveReaction) => void;
	sweepExpiredReactions: (now: number) => void;
	setLayout: (layout: TConferenceLayout) => void;
	setVideoQuality: (quality: VideoQuality) => void;
	setCameraSource: (facing: TCameraFacing, deviceId: string | undefined) => void;
	setAudioOutput: (audioOutput: string) => void;
	reset: () => void;
};

export const useConferenceInteractionStore = create<TConferenceInteractionStore>(set => ({
	hands: {},
	reactions: [],
	layout: 'grid',
	videoQuality: 'auto',
	cameraFacing: 'user',
	cameraDeviceId: undefined,
	audioOutput: 'speaker',

	applyHandMessage: (identity, message, now) => set(current => ({ hands: applyHand(current.hands, identity, message, now) })),

	dropParticipantHand: identity => set(current => ({ hands: dropHand(current.hands, identity) })),

	addReaction: reaction => set(current => ({ reactions: [...current.reactions, reaction] })),

	sweepExpiredReactions: now => set(current => ({ reactions: sweepReactions(current.reactions, now) })),

	setLayout: layout => set({ layout }),

	setVideoQuality: videoQuality => set({ videoQuality }),

	setCameraSource: (cameraFacing, cameraDeviceId) => set({ cameraFacing, cameraDeviceId }),

	setAudioOutput: audioOutput => set({ audioOutput }),

	reset: () =>
		set({
			hands: {},
			reactions: [],
			cameraFacing: 'user',
			cameraDeviceId: undefined,
			videoQuality: 'auto',
			audioOutput: 'speaker'
		})
}));
