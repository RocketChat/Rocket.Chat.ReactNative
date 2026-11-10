import type { TSettingsState } from '~/reducers/settings';
import log from '../helpers/log';
import { fetchForWorkspace } from '../serverBasicAuth';
import { parseSettings, _prepareSettings } from '../parseSettings';
import { compareServerVersion } from '../helpers/compareServerVersion';

const quickRepliesSettingIds = [
	'Apple_Watch_Quick_Actions',
	'Apple_Watch_Quick_Actions_Max_Count',
	'Apple_Watch_Quick_Actions_Max_Length'
];

export const getQuickRepliesSettings = async (server: string, serverVersion: string): Promise<TSettingsState> => {
	try {
		const url = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')
			? `${server}/api/v1/settings.public?_id=${quickRepliesSettingIds.join(',')}`
			: `${server}/api/v1/settings.public?query={"_id":{"$in":${JSON.stringify(quickRepliesSettingIds)}}}`;
		const response = await fetchForWorkspace(server, url);
		const result = await response.json();
		return result.success ? parseSettings(_prepareSettings(result.settings)) : {};
	} catch (e) {
		log(e);
		return {};
	}
};
