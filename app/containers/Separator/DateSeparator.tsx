import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import dayjs from '../../lib/dayjs';
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

export const formatSeparatorDate = (ts: Date | string): string => dayjs(ts).format('LL');

export const DateSeparatorLabel = ({ ts }: { ts: Date | string }): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.label, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
			<Text style={[styles.text, { color: colors.buttonFontSecondary }]}>{formatSeparatorDate(ts)}</Text>
		</View>
	);
};

const DateSeparator = ({ ts }: { ts: Date | string }): ReactElement => {
	const { colors } = useTheme();
	const lineStyle = { backgroundColor: colors.strokeLight };

	return (
		<View style={separatorStyles.container}>
			<View style={[separatorStyles.line, lineStyle]} />
			<DateSeparatorLabel ts={ts} />
			<View style={[separatorStyles.line, lineStyle]} />
		</View>
	);
};

export default DateSeparator;
