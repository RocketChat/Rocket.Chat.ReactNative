import sdk from './sdk';

export const createChannel = ({
	name,
	users,
	type,
	readOnly,
	broadcast,
	encrypted,
	teamId
}: {
	name: string;
	users: string[];
	type: boolean;
	readOnly: boolean;
	broadcast: boolean;
	encrypted: boolean;
	teamId: string;
}): any => {
	const params = {
		name,
		members: users,
		readOnly,
		extraData: {
			broadcast,
			encrypted,
			...(teamId && { teamId })
		}
	};
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(type ? 'groups.create' : 'channels.create', params);
};

export const e2eSetUserPublicAndPrivateKeys = (public_key: string, private_key: string) =>
	// RC 2.2.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('e2e.setUserPublicAndPrivateKeys', { public_key, private_key });

export const e2eRequestSubscriptionKeys = () =>
	// RC 0.72.0
	sdk.methodCallWrapper('e2e.requestSubscriptionKeys');

export const e2eGetUsersOfRoomWithoutKey = (rid: string) =>
	// RC 0.70.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('e2e.getUsersOfRoomWithoutKey', { rid });

export const e2eSetRoomKeyID = (rid: string, keyID: string) =>
	// RC 0.70.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('e2e.setRoomKeyID', { rid, keyID });

export const e2eUpdateGroupKey = (uid: string, rid: string, key: string) =>
	// RC 0.70.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('e2e.updateGroupKey', { uid, rid, key });

export const e2eRequestRoomKey = (rid: string, e2eKeyId: string) =>
	// RC 0.70.0
	sdk.methodCallWrapper('stream-notify-room-users', `${rid}/e2ekeyRequest`, rid, e2eKeyId);

export const updateJitsiTimeout = (roomId: string) =>
	// RC 0.74.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('video-conference/jitsi.update-timeout', { roomId });

export const register = (credentials: any) =>
	// RC 0.50.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.register', credentials);

export const forgotPassword = (email: string) =>
	// RC 0.64.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.forgotPassword', { email });

export const sendConfirmationEmail = (email: string) => sdk.methodCallWrapper('sendConfirmationEmail', email);

export const spotlight = (search: string, usernames: string, type: { users: boolean; rooms: boolean }) =>
	// RC 0.51.0
	sdk.methodCallWrapper('spotlight', search, usernames, type);

export const createDirectMessage = (username: string) =>
	// RC 0.59.0
	sdk.post('im.create', { username });

export const createDiscussion = ({
	prid,
	pmid,
	t_name,
	reply,
	users,
	encrypted
}: {
	prid: string;
	pmid?: string;
	t_name: string;
	reply?: string;
	users?: string[];
	encrypted?: boolean;
}) =>
	// RC 1.0.0
	sdk.post('rooms.createDiscussion', {
		prid,
		pmid,
		t_name,
		reply,
		users,
		encrypted
	});

export const getDiscussions = ({
	roomId,
	offset,
	count,
	text
}: {
	roomId: string | undefined;
	text?: string | undefined;
	offset: number;
	count: number;
}) => {
	const params = {
		roomId,
		offset,
		count,
		...(text && { text })
	};
	// RC 2.4.0
	return sdk.get('chat.getDiscussions', params);
};
