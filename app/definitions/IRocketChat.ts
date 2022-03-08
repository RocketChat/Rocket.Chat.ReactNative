import rocketchat from '../lib/rocketchat';

type TRocketChat = typeof rocketchat;

export interface IRocketChat extends TRocketChat {
	closeListener: any;
	usersListener: any;
	notifyAllListener: any;
	rolesListener: any;
	notifyLoggedListener: any;
	activeUsers: any;
	_setUserTimer: any;
	connectedListener: any;
	connectingListener: any;
	connectTimeout: any;
	sdk: any;
	activeUsersSubTimeout: any;
	roomsSub: any;
}
