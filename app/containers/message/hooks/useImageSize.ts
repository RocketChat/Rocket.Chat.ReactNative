import { useEffect, useState } from 'react';
import { Image } from 'expo-image';

import { type TDownloadState } from '~/lib/methods/handleMediaDownload';
import { type TMediaSize } from '~/lib/animations/mediaSharedTransition';
import log from '~/lib/methods/helpers/log';

const MAX_DECODED_SIDE = 1000;
const UNKNOWN_SIZE: TMediaSize = { width: 0, height: 0 };

export const useImageSize = (uri: string, status: TDownloadState): TMediaSize => {
	const [imageSize, setImageSize] = useState(UNKNOWN_SIZE);

	useEffect(() => {
		if (status !== 'downloaded') {
			return;
		}
		Image.loadAsync(uri, {
			onError: log,
			maxHeight: MAX_DECODED_SIDE,
			maxWidth: MAX_DECODED_SIDE
		}).then(image => {
			setImageSize({ width: image.width, height: image.height });
		});
	}, [uri, status]);

	return imageSize;
};
