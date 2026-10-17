import { getMembersWithoutChatAccess } from './getMembersWithoutChatAccess';
import { isInVideoConference } from './isInVideoConference';

type TMember = { _id: string; joined?: boolean; leftAt?: Date | string };

interface ICountMembersWhoCannotSeeChat {
	info: { users: TMember[]; chatAccess: { membersWithoutAccess: string[] } } | undefined;
	viewerId: string | undefined;
}

export const countMembersWhoCannotSeeChat = ({ info, viewerId }: ICountMembersWhoCannotSeeChat): number => {
	if (!info || (viewerId && info.chatAccess.membersWithoutAccess.includes(viewerId))) {
		return 0;
	}
	return getMembersWithoutChatAccess(info.users, info.chatAccess.membersWithoutAccess).filter(isInVideoConference).length;
};
