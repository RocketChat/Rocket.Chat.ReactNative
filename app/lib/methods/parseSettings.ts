import { defaultSettings } from '../constants';

export function parseSettings(settings) {
	return settings.reduce((ret, item) => {
		ret[item._id] = defaultSettings[item._id] && item[defaultSettings[item._id].type];
		if (item._id === 'Hide_System_Messages') {
			ret[item._id] = ret[item._id].reduce(
				(array, value) => [...array, ...(value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value])],
				[]
			);
		}
		return ret;
	});
}

export function _prepareSettings(settings) {
	return settings.map(setting => {
		setting[defaultSettings[setting._id].type] = setting.value;
		return setting;
	});
}
