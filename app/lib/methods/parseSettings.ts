import { defaultSettings } from '../constants';

export function parseSettings(settings: any) {
	return settings.reduce((ret: any, item: any) => {
		// @ts-ignore
		if (item._id === 'Presence_broadcast_disabled') {
			ret[item._id] = true;
			return ret;
		}
		ret[item._id] = defaultSettings[item._id] && item[defaultSettings[item._id].type];
		if (item._id === 'Hide_System_Messages') {
			ret[item._id] = ret[item._id].reduce(
				(array: any, value: any) => [...array, ...(value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value])],
				[]
			);
		}
		return ret;
	}, {});
}

export function _prepareSettings(settings: any) {
	return settings.map((setting: any) => {
		// @ts-ignore
		setting[defaultSettings[setting._id].type] = setting.value;
		return setting;
	});
}
