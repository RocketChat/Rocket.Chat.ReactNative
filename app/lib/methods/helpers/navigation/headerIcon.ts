import type { ImageSourcePropType } from 'react-native';

import { IconSet, type TIconsName } from '~/containers/CustomIcon';

const HEADER_ICON_SIZE = 24;

const HEADER_ICONS: TIconsName[] = [
	'close',
	'create',
	'directory',
	'encrypted',
	'hamburguer',
	'kebab',
	'notification',
	'notification-disabled',
	'phone',
	'threads',
	'workspaces'
];

const headerIconSources = new Map<TIconsName, ImageSourcePropType>();

export const preloadHeaderIcons = async () => {
	await Promise.all(
		HEADER_ICONS.map(async name => {
			const source = await IconSet.getImageSource(name, HEADER_ICON_SIZE, 'black');
			if (source) {
				headerIconSources.set(name, source);
			}
		})
	);
};

export const headerIcon = (name: TIconsName) => {
	const source = headerIconSources.get(name);
	return source ? { type: 'image' as const, source } : undefined;
};
