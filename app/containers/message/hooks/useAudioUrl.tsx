import { useState, useEffect } from 'react';

import { useAppSelector } from '../../../lib/hooks';
import { getAudioUrl } from '../../../lib/methods/getAudioUrl';

export const useAudioUrl = ({ audioUrl }: { audioUrl?: string }): string => {
	const [filePath, setFilePath] = useState<string>('');

	const { cdnPrefix, baseUrl } = useAppSelector(state => ({
		cdnPrefix: state.settings.CDN_PREFIX as string,
		baseUrl: state.server.server
	}));

	useEffect(() => {
		if (!audioUrl) {
			return;
		}
		const url = getAudioUrl({ baseUrl, cdnPrefix, audioUrl });
		if (url) {
			setFilePath(url);
		}
	}, [audioUrl, baseUrl, cdnPrefix]);

	return filePath;
};
