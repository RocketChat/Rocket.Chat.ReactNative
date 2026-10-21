import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IPresentingPills {
	presenters: { name: string; isSelf: boolean }[];
	onStop: () => void;
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 8
	},
	pill: {
		maxWidth: '100%',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	},
	stopText: {
		...sharedStyles.textBold,
		fontSize: 12,
		lineHeight: 16
	}
});

const PresentingPills = ({ presenters, onStop }: IPresentingPills): ReactElement | null => {
	const { colors } = useTheme();

	if (presenters.length === 0) {
		return null;
	}

	const [first] = presenters;
	const others = presenters.length - 1;
	const label = I18n.t(first.isSelf ? 'Presenting_you' : 'Presenting_name', { name: first.name });
	const sharingMyself = presenters.some(({ isSelf }) => isSelf);

	return (
		<View style={styles.row}>
			<View style={[styles.pill, { backgroundColor: colors.surfaceLight }]} testID='conference-presenting-pill'>
				<Text style={[styles.text, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
					{others > 0 ? `${label} +${others}` : label}
				</Text>
			</View>
			{sharingMyself ? (
				<Pressable
					onPress={onStop}
					accessibilityRole='button'
					accessibilityLabel={I18n.t('Stop_presenting')}
					testID='conference-stop-presenting'
					style={[styles.pill, { backgroundColor: colors.buttonBackgroundDangerDefault }]}>
					<Text style={[styles.stopText, { color: colors.buttonFontDanger }]} numberOfLines={1}>
						{I18n.t('Stop_presenting')}
					</Text>
				</Pressable>
			) : null}
		</View>
	);
};

export default PresentingPills;
