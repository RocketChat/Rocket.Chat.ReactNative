// Spread Methods
import * as getPermalinks from './methods/getPermalinks';
import * as helpers from './methods/helpers';
import * as search from './methods/search';
import * as setUser from './methods/setUser';

const RocketChat = {
	...search,
	...getPermalinks,
	...helpers,
	...setUser // this
};

export default RocketChat;
