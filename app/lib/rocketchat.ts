import { _setUser } from './methods/setUser';
import { logout } from './methods/logout';
import { subscribeRooms, unsubscribeRooms } from './methods/subscribeRooms';
import { subscribeUsersPresence } from './methods/getUsersPresence';
import { connect } from './services/connect';

const RocketChat = {
	logout,
	subscribeRooms,
	unsubscribeRooms,
	_setUser,
	subscribeUsersPresence,
	connect
};

export default RocketChat;
