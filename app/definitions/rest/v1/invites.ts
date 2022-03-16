import type { IInvite } from '../../IInvite';
import type { IServerRoom } from '../../IRoom';

export type InvitesEndpoints = {
	listInvites: {
		GET: () => Array<IInvite>;
	};
	'removeInvite/:_id': {
		DELETE: () => void;
	};
	'/v1/useInviteToken': {
		POST: (params: { token: string }) => {
			room: {
				rid: IServerRoom['_id'];
				prid: IServerRoom['prid'];
				fname: IServerRoom['fname'];
				name: IServerRoom['name'];
				t: IServerRoom['t'];
			};
		};
	};
	'/v1/validateInviteToken': {
		POST: (params: { token: string }) => { valid: boolean };
	};
};
