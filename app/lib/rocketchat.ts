// Spread Methods
import * as helpers from './methods/helpers';
import * as setUser from './methods/setUser';

const RocketChat = {
	...helpers,
	...setUser // this
};

export default RocketChat;
