import { isInVideoConference } from './isInVideoConference';

export const RINGING_WINDOW_MS = 15_000;

type TMember = {
	joined?: boolean;
	leftAt?: Date | string;
	declined?: boolean;
	declinedAt?: Date | string;
	ringingAt?: Date | string;
};

export type TConferenceMemberGroups<T> = { inCall: T[]; waiting: T[]; notInCall: T[] };

const timeOf = (value: Date | string): number => new Date(value).getTime();

const isRinging = ({ ringingAt, declined, declinedAt }: TMember, now: number): boolean => {
	if (!ringingAt) {
		return false;
	}
	if (declined && declinedAt && timeOf(declinedAt) >= timeOf(ringingAt)) {
		return false;
	}
	return now - timeOf(ringingAt) < RINGING_WINDOW_MS;
};

export const groupConferenceMembers = <T extends TMember>(members: T[], now: number): TConferenceMemberGroups<T> => {
	const inCall = members.filter(member => isInVideoConference(member));
	const rest = members.filter(member => !isInVideoConference(member));
	return {
		inCall,
		waiting: rest.filter(member => isRinging(member, now)),
		notInCall: rest.filter(member => !isRinging(member, now))
	};
};

export const nextRingingLapse = (members: TMember[], now: number): number | undefined => {
	const lapses = members.flatMap(member =>
		member.ringingAt && !isInVideoConference(member) && isRinging(member, now)
			? [timeOf(member.ringingAt) + RINGING_WINDOW_MS]
			: []
	);
	return lapses.length ? Math.min(...lapses) : undefined;
};
