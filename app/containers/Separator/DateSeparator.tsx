import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatLongDate } from '../../lib/dayjs';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { separatorStyles } from './styles';

const styles = StyleSheet.create({
	text: {
		fontSize: 14,
		...sharedStyles.textBold
	},
	label: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 16
	}
});

export const DateSeparatorLabel = ({ ts }: { ts: Date | string }): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.label, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
			<Text style={[styles.text, { color: colors.buttonFontSecondary }]}>{formatLongDate(ts)}</Text>
		</View>
	);
};

const DateSeparator = ({ ts }: { ts: Date | string }): ReactElement => {
	const { colors } = useTheme();
	const lineStyle = { backgroundColor: colors.strokeExtraLight };

	return (
		<View style={separatorStyles.container}>
			<View style={[separatorStyles.line, lineStyle]} />
			<DateSeparatorLabel ts={ts} />
			<View style={[separatorStyles.line, lineStyle]} />
		</View>
	);
};

export default DateSeparator;
