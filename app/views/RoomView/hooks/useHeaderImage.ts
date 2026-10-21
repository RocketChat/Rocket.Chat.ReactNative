import { useEffect, useState } from 'react';
import { Image } from 'react-native';

import log from '~/lib/methods/helpers/log';

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
