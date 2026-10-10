import type { ImageURISource } from 'react-native';

import { IconSet, type TIconsName } from '~/containers/CustomIcon';

const HEADER_ICON_SIZE = 30;
const HEADER_ICON_GLYPH_PADDING = HEADER_ICON_SIZE / 12;

const HEADER_ICONS: TIconsName[] = [
	'add',
	'chat-close',
	'chat-forward',
	'close',
	'create',
	'directory',
	'download',
	'edit',
	'encrypted',
	'filter',
	'hamburguer',
	'kebab',
	'move-to-the-queue',
	'notification',
	'notification-disabled',
	'pause',
	'phone',
	'search',
	'settings',
	'sort',
	'threads',
	'workspaces'
];

const HEADER_ICON_COLOR = 'black';

const iconImages = new Map<string, ImageURISource>();

const iconImageKey = (name: TIconsName, size: number, color: string) => `${name}:${size}:${color}`;

export const getIconImage = (name: TIconsName, size: number, color: string) => iconImages.get(iconImageKey(name, size, color));

export const loadIconImage = async (name: TIconsName, size: number, color: string) => {
	const cached = getIconImage(name, size, color);
	if (cached) {
		return cached;
	}
	const source = await IconSet.getImageSource(name, size, color);
	if (source) {
		iconImages.set(iconImageKey(name, size, color), source);
	}
	return source;
};

let preloadPromise: Promise<void> | undefined;

const loadHeaderIcons = async () => {
	await Promise.all(HEADER_ICONS.map(name => loadIconImage(name, HEADER_ICON_SIZE, HEADER_ICON_COLOR)));
};

export const preloadHeaderIcons = () => {
	preloadPromise ??= loadHeaderIcons().catch(error => {
		preloadPromise = undefined;
		throw error;
	});
	return preloadPromise;
};

export const headerIcon = (name: TIconsName) => {
	if (__DEV__ && !HEADER_ICONS.includes(name)) {
		console.warn(`headerIcon: '${name}' is not in HEADER_ICONS and will render without an icon`);
	}
	const source = getIconImage(name, HEADER_ICON_SIZE, HEADER_ICON_COLOR);
	return source ? { type: 'image' as const, source: { ...source, alignmentInset: HEADER_ICON_GLYPH_PADDING } } : undefined;
};
