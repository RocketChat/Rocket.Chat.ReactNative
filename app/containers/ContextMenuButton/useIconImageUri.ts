import { useEffect, useState } from 'react';

import { IconSet, type TIconsName } from '../CustomIcon';

const imageUris = new Map<string, Promise<string | undefined>>();

const renderIconImage = (name: TIconsName, size: number, color: string) => {
	const key = `${name}-${size}-${color}`;
	const cached = imageUris.get(key);
	if (cached) {
		return cached;
	}
	const pending = IconSet.getImageSource(name, size, color).then(
		source => source?.uri,
		() => undefined
	);
	imageUris.set(key, pending);
	return pending;
};

export const useIconImageUri = (name: TIconsName | undefined, size: number, color: string) => {
	const [uri, setUri] = useState<string>();

	useEffect(() => {
		if (!name) {
			return;
		}
		let active = true;
		renderIconImage(name, size, color).then(renderedUri => {
			if (active) {
				setUri(renderedUri);
			}
		});
		return () => {
			active = false;
		};
	}, [name, size, color]);

	return name ? uri : undefined;
};
