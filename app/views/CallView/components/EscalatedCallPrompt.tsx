import { Text, View } from 'react-native';
import type { ReactElement } from 'react';

import Button from '~/containers/Button';
import I18n from '~/i18n';
import { escalateToVideo } from '~/lib/services/voip/escalateToVideo';
import { useIsCallEscalated } from '~/lib/services/voip/useCallStore';
import { styles } from '../styles';
import { useTheme } from '~/theme';

const EscalatedCallPrompt = (): ReactElement | null => {
	const { colors } = useTheme();
	const escalated = useIsCallEscalated();

	if (!escalated) {
		return null;
	}

	return (
		<View style={styles.escalatedPrompt} testID='call-view-escalated'>
			<Text style={[styles.statusText, { color: colors.fontDefault }]}>{I18n.t('Switched_to_video_call')}</Text>
			<Button
				title={I18n.t('Join_video_call')}
				onPress={escalateToVideo}
				style={styles.escalatedPromptButton}
				testID='call-view-join-video'
			/>
		</View>
	);
};

export default EscalatedCallPrompt;
