// Spread Methods
import * as helpers from './methods/helpers';
import * as search from './methods/search';
import * as setUser from './methods/setUser';

const RocketChat = {
	...search,
	...helpers,
	...setUser // this
};

export default RocketChat;
