import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import sharedStyles from '../../../views/Styles';
import Timer from './Timer';
import Status from '../../Status';

const styles = StyleSheet.create({
	headerTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	},
	headerTitleText: {
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

	const caller = contact.displayName || contact.username;
	const isConnected = callState === 'active';

	return (
		<View style={styles.headerTitleContainer} testID='call-view-header-title'>
			<Status id={contact.id || ''} size={12} />
			<Text style={[styles.headerTitleText, { color: colors.fontDefault }]} numberOfLines={1}>
				{caller}
				{isConnected && callStartTime ? <Timer /> : null}
			</Text>
		</View>
	);
};

export default Title;
