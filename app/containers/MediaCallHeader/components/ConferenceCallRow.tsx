import { Pressable, StyleSheet, Text, View } from 'react-native';

import I18n from '../../../i18n';
import { closeConferenceCall, expandConferenceCall } from '../../../lib/services/conference/conferenceCallNavigation';
import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';
import * as HeaderButton from '../../Header/components/HeaderButton';

// Mirrors the VoIP Title/Subtitle type scale so both calls read as the same header.
const styles = StyleSheet.create({
	button: {
		flex: 1,
		paddingHorizontal: 4
	},
	container: {
		flexGrow: 1,
		flexDirection: 'column',
		justifyContent: 'space-evenly',
		alignItems: 'flex-start'
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		lineHeight: 24
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	}
});

const ConferenceCallRow = () => {
	const { colors } = useTheme();

	return (
		<>
			<HeaderButton.Container left>
				<HeaderButton.Item
					testID='conference-call-header-expand'
					accessibilityLabel={I18n.t('Return_to_call')}
					onPress={expandConferenceCall}
					iconName='arrow-expand'
					color={colors.fontDefault}
				/>
			</HeaderButton.Container>
			<Pressable testID='conference-call-header-content' onPress={expandConferenceCall} style={styles.button}>
				<View style={styles.container}>
					<Text style={[styles.title, { color: colors.fontDefault }]} numberOfLines={1}>
						{I18n.t('Video_call')}
					</Text>
					<Text style={[styles.subtitle, { color: colors.fontSecondaryInfo }]} numberOfLines={1}>
						{I18n.t('Return_to_call')}
					</Text>
				</View>
			</Pressable>
			<HeaderButton.Container>
				<HeaderButton.Item
					testID='conference-call-header-end'
					accessibilityLabel={I18n.t('End')}
					onPress={closeConferenceCall}
					iconName='phone-off'
					color={colors.fontDanger}
				/>
			</HeaderButton.Container>
		</>
	);
};

export default ConferenceCallRow;
