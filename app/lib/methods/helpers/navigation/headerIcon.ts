import type { ImageSourcePropType } from 'react-native';

import { IconSet, type TIconsName } from '~/containers/CustomIcon';

const HEADER_ICON_SIZE = 30;

const HEADER_ICONS: TIconsName[] = [
	'chat-close',
	'chat-forward',
	'close',
	'create',
	'directory',
	'encrypted',
	'hamburguer',
	'kebab',
	'move-to-the-queue',
	'notification',
	'notification-disabled',
	'pause',
	'phone',
	'search',
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
