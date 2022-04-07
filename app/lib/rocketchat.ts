// Methods
import canOpenRoom from './methods/canOpenRoom';
import clearCache from './methods/clearCache';
import getRoom from './methods/getRoom';
import getRooms from './methods/getRooms';
import getSlashCommands from './methods/getSlashCommands';
import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';
import loadNextMessages from './methods/loadNextMessages';
import loadSurroundingMessages from './methods/loadSurroundingMessages';
import loadThreadMessages from './methods/loadThreadMessages';
import readMessages from './methods/readMessages';
import roomTypeToApiType from './methods/roomTypeToApiType';
// Spread Methods
import * as sendMessage from './methods/sendMessage';
import * as callJitsi from './methods/callJitsi';
import * as enterpriseModules from './methods/enterpriseModules';
import * as getCustomEmojis from './methods/getCustomEmojis';
import * as getPermalinks from './methods/getPermalinks';
import * as getPermissions from './methods/getPermissions';
import * as getRoles from './methods/getRoles';
import * as getSettings from './methods/getSettings';
import * as getUsersPresence from './methods/getUsersPresence';
import * as helpers from './methods/helpers';
import * as logout from './methods/logout';
import * as search from './methods/search';
import * as sendFileMessage from './methods/sendFileMessage';
import * as setUser from './methods/setUser';
import * as triggerActions from './methods/triggerActions';
import * as userPreferencesMethods from './methods/userPreferencesMethods';
import * as connect from './services/connect';
import * as restApis from './services/restApi';
import * as shareExtension from './services/shareExtension';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const CURRENT_SERVER = 'currentServer';
const CERTIFICATE_KEY = 'RC_CERTIFICATE_KEY';

const RocketChat = {
	TOKEN_KEY,
	CURRENT_SERVER,
	CERTIFICATE_KEY,
	...restApis,
	...search,
	...getPermalinks,
	...connect,
	...enterpriseModules,
	...sendMessage,
	...shareExtension,
	...sendFileMessage,
	...logout,
	...getUsersPresence,
	...getSettings,
	...getRoles,
	...getPermissions,
	...triggerActions,
	...callJitsi,
	...getCustomEmojis,
	...helpers,
	...userPreferencesMethods,
	...setUser,

	canOpenRoom,
	clearCache,
	loadMissedMessages,
	loadMessagesForRoom,
	loadSurroundingMessages,
	loadNextMessages,
	loadThreadMessages,
	getRooms,
	readMessages,
	getSlashCommands,
	getRoom,
	roomTypeToApiType
};

export default RocketChat;
