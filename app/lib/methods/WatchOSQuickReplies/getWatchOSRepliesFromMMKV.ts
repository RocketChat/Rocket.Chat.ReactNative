import { WATCHOS_QUICKREPLIES } from '../../constants/keys';
import UserPreferences from '../userPreferences';

export const getWatchOSRepliesForServer = (server: string) => UserPreferences.getBool(`${server}-${WATCHOS_QUICKREPLIES}`);
