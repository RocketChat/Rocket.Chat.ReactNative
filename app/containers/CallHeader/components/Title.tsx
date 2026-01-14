import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../theme';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import I18n from '../../../i18n';
import sharedStyles from '../../../views/Styles';
import Timer from './Timer';

const styles = StyleSheet.create({
	headerTitle: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		lineHeight: 24
	}
});

const Title = () => {
	'use memo';

	const { colors } = useTheme();
	const callState = useCallStore(state => state.callState);
	const callStartTime = useCallStore(state => state.callStartTime);
	const contact = useCallStore(state => state.contact);

	const callerName = contact.displayName || contact.username || I18n.t('Unknown');
	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';
	const isConnected = callState === 'active';

	const getHeaderTitle = () => {
		if (isConnecting) {
			return I18n.t('Connecting');
		}
		if (isConnected && callStartTime) {
			return `${callerName} – `;
		}
		return callerName;
	};

	return (
		<Text style={[styles.headerTitle, { color: colors.fontDefault }]} testID='call-view-header-title'>
			{getHeaderTitle()}
			<Timer />
		</Text>
	);
};

export default Title;
