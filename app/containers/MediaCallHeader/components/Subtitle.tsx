import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../theme';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import I18n from '../../../i18n';
import sharedStyles from '../../../views/Styles';

const styles = StyleSheet.create({
	headerSubtitle: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	}
});

const Subtitle = () => {
	'use memo';

	const { colors } = useTheme();
	const contact = useCallStore(state => state.contact);
	const extension = contact.sipExtension;
	const remoteHeld = useCallStore(state => state.remoteHeld);
	const remoteMute = useCallStore(state => state.remoteMute);
	const callState = useCallStore(state => state.callState);
	const isConnected = callState === 'active';

	let subtitle = '';

	if (!isConnected) {
		subtitle = I18n.t('Connecting');
	} else {
		subtitle = extension ? `${extension}` : '';
		const remoteState = [];
		remoteState.push(remoteHeld ? I18n.t('On_hold') : null);
		remoteState.push(remoteMute ? I18n.t('Muted') : null);
		subtitle += remoteState.filter(Boolean).length > 0 && extension ? ' - ' : '';
		subtitle += remoteState.filter(Boolean).join(', ');
	}

	if (!subtitle) {
		return null;
	}

	return (
		<Text
			style={[styles.headerSubtitle, { color: colors.fontSecondaryInfo }]}
			testID='call-view-header-subtitle'
			numberOfLines={1}>
			{subtitle}
		</Text>
	);
};

export default Subtitle;
