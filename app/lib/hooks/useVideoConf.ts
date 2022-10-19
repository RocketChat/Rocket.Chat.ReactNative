import { useCallback } from 'react';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import i18n from '../../i18n';
import { videoConfJoin } from '../methods/videoConf';

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
