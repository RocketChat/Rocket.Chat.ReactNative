import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { useSpeakingWhileMuted } from './useSpeakingWhileMuted';

interface ISpeakingWhileMutedNotice {
	enabled: boolean;
}

const styles = StyleSheet.create({
	notice: {
		position: 'absolute',
		bottom: 8,
		alignSelf: 'center',
		maxWidth: '90%',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	text: {
		...sharedStyles.textMedium,
		flexShrink: 1,
		fontSize: 14,
		lineHeight: 20
	}
});

const SpeakingWhileMutedNotice = ({ enabled }: ISpeakingWhileMutedNotice): ReactElement | null => {
	const { colors } = useTheme();
	const speaking = useSpeakingWhileMuted(enabled);

	if (!speaking) {
		return null;
	}

	return (
		<View
			accessibilityLiveRegion='polite'
			pointerEvents='none'
			style={[styles.notice, { backgroundColor: colors.badgeBackgroundLevel4 }]}
			testID='conference-speaking-while-muted'>
			<CustomIcon name='mic-off' size={16} color={colors.fontPureWhite} />
			<Text style={[styles.text, { color: colors.fontPureWhite }]} numberOfLines={2}>
				{I18n.t('You_are_muted')}
			</Text>
		</View>
	);
};

export default SpeakingWhileMutedNotice;
