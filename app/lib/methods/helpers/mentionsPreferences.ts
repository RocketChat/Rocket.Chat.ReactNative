import { MENTIONS_PREFERENCES_KEY } from '../../constants';
import UserPreferences from '../userPreferences';
import { IMentionsPreferences } from '../../../definitions/IMentionsPreferences';

export const initialMentionsPreferences = (): IMentionsPreferences => {
	const mentionsPreferences = UserPreferences.getMap(MENTIONS_PREFERENCES_KEY) as IMentionsPreferences;

	return mentionsPreferences;
};
