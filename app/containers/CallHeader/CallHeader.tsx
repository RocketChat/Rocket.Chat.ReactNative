import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';
import { simulateCall } from '../../lib/services/voip/simulateCall';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import Navigation from '../../lib/navigation/appNavigation';

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	headerTitle: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		lineHeight: 24
	},
	headerButton: {
		// padding: 8
	}
});

const CallHeader = () => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	// const call = useCallStore(state => state.call);
	const callState = useCallStore(state => state.callState);
	const callStartTime = useCallStore(state => state.callStartTime);
	const contact = useCallStore(state => state.contact);
	const endCall = useCallStore(state => state.endCall);
	const toggleFocus = useCallStore(state => state.toggleFocus);
	const callDuration = '00:00';

	const handleCollapse = () => {
		toggleFocus();
	};

	const handleEndCall = () => {
		endCall();
	};

	const callerName = contact.displayName || contact.username || I18n.t('Unknown');
	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';
	const isConnected = callState === 'active';

	const getHeaderTitle = () => {
		if (isConnecting) {
			return I18n.t('Connecting');
		}
		if (isConnected && callStartTime) {
			return `${callerName} – ${callDuration}`;
		}
		return callerName;
	};

	return (
		<View
			style={[
				styles.header,
				{ backgroundColor: colors.surfaceNeutral, paddingTop: insets.top, borderBottomColor: colors.strokeLight }
			]}>
			<Pressable onPress={handleCollapse} style={styles.headerButton} hitSlop={8} accessibilityLabel={I18n.t('Minimize')}>
				<CustomIcon name='arrow-down' size={24} color={colors.fontDefault} />
			</Pressable>
			<Text style={[styles.headerTitle, { color: colors.fontDefault }]} testID='call-view-header-title'>
				{getHeaderTitle()}
			</Text>
			<Pressable onPress={handleEndCall} style={styles.headerButton} accessibilityLabel={I18n.t('End')}>
				<CustomIcon name='phone-end' size={24} color={colors.fontDanger} />
			</Pressable>
		</View>
	);
};

export default CallHeader;
