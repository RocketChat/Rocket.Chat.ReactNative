import { IUser } from '../../IUser';

export type E2eEndpoints = {
	'e2e.setUserPublicAndPrivateKeys': {
		POST: (params: { public_key: string; private_key: string; force?: boolean }) => void;
	};
	'e2e.getUsersOfRoomWithoutKey': {
		GET: (params: { rid: string }) => {
			users: Pick<IUser, '_id' | 'e2e'>[];
		};
	};
	'e2e.updateGroupKey': {
		POST: (params: { uid: string; rid: string; key: string }) => {};
	};
	'e2e.acceptSuggestedGroupKey': {
		POST: (params: { rid: string }) => {};
	};
	'e2e.rejectSuggestedGroupKey': {
		POST: (params: { rid: string }) => {};
	};
	'e2e.fetchUsersWaitingForGroupKey': {
		GET: (params: { roomIds: string[] }) => {
			usersWaitingForE2EKeys: any;
		};
	};
	'e2e.provideUsersSuggestedGroupKeys': {
		POST: (params: { usersSuggestedGroupKeys: any }) => void;
	};
	'e2e.setRoomKeyID': {
		POST: (params: { rid: string; keyID: string }) => {};
	};
	'e2e.fetchMyKeys': {
		GET: () => { public_key: string; private_key: string };
	};
	'e2e.resetRoomKey': {
		POST: (params: { rid: string; e2eKey: string; e2eKeyId: string }) => void;
	};
};
