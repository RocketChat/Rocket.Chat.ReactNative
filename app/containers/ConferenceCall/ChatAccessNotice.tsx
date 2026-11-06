import { type ReactElement, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IChatAccessNotice {
	count: number;
	onReview: () => void;
}

const styles = StyleSheet.create({
	notice: {
		minHeight: 44,
		paddingLeft: 16,
		paddingRight: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	text: {
		...sharedStyles.textRegular,
		flex: 1,
		fontSize: 14,
		lineHeight: 20
	},
	review: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
		borderWidth: 1
	},
	reviewText: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	dismiss: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const ChatAccessNotice = ({ count, onReview }: IChatAccessNotice): ReactElement | null => {
	const { colors } = useTheme();
	const [dismissed, setDismissed] = useState(false);

	if (count === 0 || dismissed) {
		return null;
	}

	return (
		<View style={[styles.notice, { backgroundColor: colors.statusBackgroundInfo }]} testID='conference-chat-access-banner'>
			<Text style={[styles.text, { color: colors.statusFontInfo }]} numberOfLines={2} accessibilityRole='text'>
				{I18n.t('Chat_access_notice', { count })}
			</Text>
			<Pressable
				onPress={onReview}
				accessibilityRole='button'
				style={[styles.review, { borderColor: colors.statusFontInfo }]}
				testID='conference-chat-access-review'>
				<Text style={[styles.reviewText, { color: colors.statusFontInfo }]}>{I18n.t('Review')}</Text>
			</Pressable>
			<Pressable
				onPress={() => setDismissed(true)}
				accessibilityRole='button'
				accessibilityLabel={I18n.t('Dismiss')}
				style={styles.dismiss}
				testID='conference-chat-access-dismiss'>
				<CustomIcon name='close' size={20} color={colors.statusFontInfo} />
			</Pressable>
		</View>
	);
};

export default ChatAccessNotice;
