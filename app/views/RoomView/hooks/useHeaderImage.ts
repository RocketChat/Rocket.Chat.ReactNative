import { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType } from 'react-native';

import { type TIconsName } from '~/containers/CustomIcon';
import { getIconImage, loadIconImage } from '~/lib/methods/helpers/navigation/headerIcon';
import log from '~/lib/methods/helpers/log';

export const useHeaderIconImage = (name: TIconsName | undefined, color: string, size: number) => {
	const [image, setImage] = useState<{ name: TIconsName; color: string; source: ImageSourcePropType }>();
	const cachedSource = name ? getIconImage(name, size, color) : undefined;
	useEffect(() => {
		let cancelled = false;
		if (name && !getIconImage(name, size, color)) {
			loadIconImage(name, size, color)
				.then(source => {
					if (!cancelled && source) {
						setImage({ name, color, source });
					}
				})
				.catch(log);
		}
		return () => {
			cancelled = true;
		};
	}, [name, color, size]);
	if (cachedSource) {
		return cachedSource;
	}
	return image?.name === name && image?.color === color ? image?.source : undefined;
};

export const useHeaderRemoteImage = (uri?: string) => {
	const [image, setImage] = useState<{ uri: string; width: number; height: number }>();
	useEffect(() => {
		let cancelled = false;
		if (uri) {
			Image.getSize(uri)
				.then(({ width, height }) => {
					if (!cancelled) {
						setImage({ uri, width, height });
					}
				})
				.catch(log);
		}
		return () => {
			cancelled = true;
		};
	}, [uri]);
	return image?.uri === uri ? image : undefined;
};
