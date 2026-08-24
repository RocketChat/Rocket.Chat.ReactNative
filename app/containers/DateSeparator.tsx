import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		margin: 12
	},
	line: {
		height: 1,
		flex: 1
	},
	text: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	label: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 16
	},
	marginHorizontal: {
		marginHorizontal: 12
	}
});

export const DateSeparatorLabel = ({ date }: { date: string }): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.label, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
			<Text style={[styles.text, { color: colors.buttonFontSecondary }]}>{date}</Text>
		</View>
	);
};

const DateSeparator = ({ date }: { date: string }): ReactElement => {
	const { colors } = useTheme();
	const lineStyle = { backgroundColor: colors.strokeLight };

	return (
		<View style={styles.container}>
			<View style={[styles.line, lineStyle]} />
			<View style={styles.marginHorizontal}>
				<DateSeparatorLabel date={date} />
			</View>
			<View style={[styles.line, lineStyle]} />
		</View>
	);
};

export default DateSeparator;
