import { _setUser } from './methods/setUser';
import { subscribeUsersPresence } from './methods/getUsersPresence';
import { connect } from './services/connect';

const RocketChat = {
	_setUser,
	subscribeUsersPresence,
	connect
};

export default RocketChat;
