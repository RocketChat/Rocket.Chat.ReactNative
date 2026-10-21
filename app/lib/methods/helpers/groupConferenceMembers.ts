import { isInVideoConference } from './isInVideoConference';

export const RINGING_WINDOW_MS = 15_000;

export type TConferenceMemberState = {
	joined?: boolean;
	leftAt?: Date | string;
	declined?: boolean;
	declinedAt?: Date | string;
	ringingAt?: Date | string;
};

export type TConferenceMemberGroups<T> = { inCall: T[]; waiting: T[]; notInCall: T[] };

const timeOf = (value: Date | string): number => new Date(value).getTime();

export const isRingingConferenceMember = ({ ringingAt, declined, declinedAt }: TConferenceMemberState, now: number): boolean => {
	if (!ringingAt) {
		return false;
	}
	if (declined && declinedAt && timeOf(declinedAt) >= timeOf(ringingAt)) {
		return false;
	}
	return now - timeOf(ringingAt) < RINGING_WINDOW_MS;
};

export const groupConferenceMembers = <T extends TConferenceMemberState>(
	members: T[],
	now: number
): TConferenceMemberGroups<T> => {
	const inCall = members.filter(member => isInVideoConference(member));
	const rest = members.filter(member => !isInVideoConference(member));
	return {
		inCall,
		waiting: rest.filter(member => isRingingConferenceMember(member, now)),
		notInCall: rest.filter(member => !isRingingConferenceMember(member, now))
	};
};

export const nextRingingLapse = (members: TConferenceMemberState[], now: number): number | undefined => {
	const lapses = members.flatMap(member =>
		member.ringingAt && !isInVideoConference(member) && isRingingConferenceMember(member, now)
			? [timeOf(member.ringingAt) + RINGING_WINDOW_MS]
			: []
	);
	return lapses.length ? Math.min(...lapses) : undefined;
};
