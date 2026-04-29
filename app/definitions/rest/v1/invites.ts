import type { IInvite } from '../../IInvite';
import type { IServerRoom } from '../../IRoom';

export type InvitesEndpoints = {
	findOrCreateInvite: {
		POST: (params: { rid: string; days: number; maxUses: number }) => IInvite;
	};
	listInvites: {
		GET: () => Array<IInvite>;
	};
	'removeInvite/:_id': {
		DELETE: () => void;
	};
	useInviteToken: {
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
	validateInviteToken: {
		POST: (params: { token: string }) => { valid: boolean };
	};
};
