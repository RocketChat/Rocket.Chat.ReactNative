import { useState, useEffect } from 'react';

import { useAppSelector } from '../../../lib/hooks';
import { getFilePath } from '../../../lib/methods/handleMediaDownload';
import { getUserSelector } from '../../../selectors/login';

export const getFilePathAudio = (
	audioUrl: string,
	audioType: string,
	baseUrl: string,
	cdnPrefix: string,
	id: string,
	token: string
): string => {
	if (audioUrl && !audioUrl.startsWith('http')) {
		audioUrl = `${cdnPrefix || baseUrl}${audioUrl}`;
	}

	return getFilePath({
		urlToCache: `${audioUrl}?rc_uid=${id}&rc_token=${token}`,
		type: 'audio',
		mimeType: audioType
	}) as string;
};

const useGetFilePathAudio = ({ audioUrl, audioType }: { audioUrl: string; audioType: string }): string => {
	const [filePath, setFilePath] = useState('');

	const { cdnPrefix, baseUrl, user } = useAppSelector(state => ({
		cdnPrefix: state.settings.CDN_PREFIX as string,
		baseUrl: state.server.server,
		user: getUserSelector(state)
	}));

	useEffect(() => {
		const url = getFilePathAudio(audioUrl, audioType, baseUrl, cdnPrefix, user.id, user.token);
		setFilePath(url);
	}, []);

	return filePath;
};

export default useGetFilePathAudio;
