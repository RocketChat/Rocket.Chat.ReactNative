import { useCallback } from 'react';

import i18n from '../../../i18n';
import { videoConfJoin } from '../../../lib/methods/videoConf';
import { TActionSheetOptionsItem, useActionSheet } from '../../ActionSheet';

export const useVideoConf = (): { joinCall: (blockId: string) => void } => {
	const { showActionSheet } = useActionSheet();

	const joinCall = useCallback(blockId => {
		const options: TActionSheetOptionsItem[] = [
			{
				title: i18n.t('Video_call'),
				icon: 'camera',
				onPress: () => videoConfJoin(blockId, true)
			},
			{
				title: i18n.t('Voice_call'),
				icon: 'microphone',
				onPress: () => videoConfJoin(blockId, false)
			}
		];
		showActionSheet({ options });
	}, []);

	return { joinCall };
};
