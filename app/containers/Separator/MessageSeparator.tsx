import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../i18n';
import { formatLongDate } from '../../lib/dayjs';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import DateSeparator from './DateSeparator';
import { separatorStyles } from './styles';

const styles = StyleSheet.create({
	text: {
		fontSize: 14,
		...sharedStyles.textMedium
	}
});

const MessageSeparator = ({ ts, unread }: { ts?: Date | string | null; unread?: boolean }): ReactElement | null => {
	const { colors } = useTheme();

	if (!ts && !unread) {
		return null;
	}

	const unreadLine = { backgroundColor: colors.buttonBackgroundDangerDefault };
	const unreadText = { color: colors.fontDanger };
	if (ts && unread) {
		return (
			<View style={separatorStyles.container}>
				<Text style={[styles.text, unreadText]}>{I18n.t('unread_messages')}</Text>
				<View style={[separatorStyles.line, unreadLine]} />
				<Text style={[styles.text, unreadText]}>{formatLongDate(ts)}</Text>
			</View>
		);
	}
	if (ts) {
		return <DateSeparator ts={ts} />;
	}
	return (
		<View style={separatorStyles.container}>
			<Text style={[styles.text, unreadText]}>{I18n.t('unread_messages')}</Text>
			<View style={[separatorStyles.line, unreadLine]} />
		</View>
	);
};

export default MessageSeparator;
