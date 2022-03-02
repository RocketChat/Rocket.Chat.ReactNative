import { IUser } from '../../IUser';

export type E2eEndpoints = {
	'e2e.setUserPublicAndPrivateKeys': {
		POST: (params: { public_key: string; private_key: string }) => void;
	};
	'e2e.getUsersOfRoomWithoutKey': {
		GET: (params: { rid: string }) => {
			users: Pick<IUser, '_id' | 'e2e'>[];
		};
	};
};
