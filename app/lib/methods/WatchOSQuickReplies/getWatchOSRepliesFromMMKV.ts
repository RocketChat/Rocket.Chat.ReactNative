import { FIRST_START } from '../../constants/keys';
import UserPreferences from '../userPreferences';

export const getWatchOSRepliesForServer = (server: string) => UserPreferences.getBool(`${server}-${FIRST_START}`);
