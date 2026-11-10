import type { TSettingsState } from '~/reducers/settings';
import log from '../helpers/log';
import { fetchForWorkspace } from '../serverBasicAuth';
import { parseSettings, _prepareSettings } from '../parseSettings';

const quickRepliesSettingIds = [
	'Apple_Watch_Quick_Actions',
	'Apple_Watch_Quick_Actions_Max_Count',
	'Apple_Watch_Quick_Actions_Max_Length'
];

export const getQuickRepliesSettings = async (server: string): Promise<TSettingsState> => {
	try {
		const response = await fetchForWorkspace(server, `${server}/api/v1/settings.public?_id=${quickRepliesSettingIds.join(',')}`);
		const result = await response.json();
		return result.success ? parseSettings(_prepareSettings(result.settings)) : {};
	} catch (e) {
		log(e);
		return {};
	}
};
