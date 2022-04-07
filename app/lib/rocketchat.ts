// Spread Methods
import * as sendMessage from './methods/sendMessage';
import * as enterpriseModules from './methods/enterpriseModules';
import * as getPermalinks from './methods/getPermalinks';
import * as helpers from './methods/helpers';
import * as search from './methods/search';
import * as setUser from './methods/setUser';

const RocketChat = {
	...search,
	...getPermalinks,
	...enterpriseModules,
	...sendMessage,
	...helpers,
	...setUser // this
};

export default RocketChat;
