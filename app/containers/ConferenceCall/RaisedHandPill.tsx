import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IRaisedHandPill {
	label: string;
	onPress: () => void;
	accessibilityLabel: string;
}

const styles = StyleSheet.create({
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
	}
});

const RaisedHandPill = ({ label, onPress, accessibilityLabel }: IRaisedHandPill): ReactElement => {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole='button'
			accessibilityLabel={accessibilityLabel}
			testID='conference-hand-pill'
			style={[styles.pill, { backgroundColor: colors.buttonBackgroundSuccessDefault }]}>
			<Text style={[styles.text, { color: colors.buttonFontSuccess }]} numberOfLines={1}>
				{`✋ ${label}`}
			</Text>
		</Pressable>
	);
};

export default RaisedHandPill;
