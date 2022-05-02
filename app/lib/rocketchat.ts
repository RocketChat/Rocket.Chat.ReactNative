import { subscribeUsersPresence } from './methods/getUsersPresence';
import { connect } from './services/connect';

const RocketChat = {
	subscribeUsersPresence,
	connect
};

export default RocketChat;
