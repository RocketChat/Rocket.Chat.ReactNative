import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useCallStore } from '../../../lib/services/voip/useCallStore';
import sharedStyles from '../../../views/Styles';
import Timer from './Timer';
import Status from '../../Status';

const styles = StyleSheet.create(theme => ({
	headerTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	},
	headerTitleText: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		lineHeight: 24,
		color: theme.colors.fontDefault
	}
}));

const Title = () => {
	'use memo';

	const callState = useCallStore(state => state.callState);
	const callStartTime = useCallStore(state => state.callStartTime);
	const contact = useCallStore(state => state.contact);

	const caller = contact.displayName || contact.username;
	const isConnected = callState === 'active';

	return (
		<View style={styles.headerTitleContainer} testID='call-view-header-title'>
			<Status id={contact.id || ''} size={16} />
			<Text style={styles.headerTitleText} numberOfLines={1}>
				{caller}
				{isConnected && callStartTime ? <Timer /> : null}
			</Text>
		</View>
	);
};

export default Title;
