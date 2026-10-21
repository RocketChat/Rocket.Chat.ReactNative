import { type VideoConferenceChatAccessMode } from '~/definitions/IVideoConference';

export const getChatAccessActions = ({
	canInvite,
	type
}: {
	canInvite: boolean;
	type: string;
}): VideoConferenceChatAccessMode[] => {
	if (!canInvite) {
		return ['discussion'];
	}
	return type === 'p' || type === 'd' ? ['discussion', 'invite'] : ['invite', 'discussion'];
};
