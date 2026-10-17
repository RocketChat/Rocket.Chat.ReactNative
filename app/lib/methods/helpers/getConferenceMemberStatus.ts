import { isRingingConferenceMember, type TConferenceMemberState } from './groupConferenceMembers';
import { isInVideoConference } from './isInVideoConference';

export type TConferenceMemberStatus = 'joined' | 'ringing' | 'left' | 'declined' | 'invited';

export const getConferenceMemberStatus = (member: TConferenceMemberState, now: number): TConferenceMemberStatus => {
	if (isInVideoConference(member)) {
		return 'joined';
	}
	if (isRingingConferenceMember(member, now)) {
		return 'ringing';
	}
	if (member.leftAt) {
		return 'left';
	}
	return member.declined ? 'declined' : 'invited';
};
