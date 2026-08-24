import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import dayjs from '../../lib/dayjs';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import DateSeparator from './DateSeparator';

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
	marginRight: {
		marginRight: 14
	},
	marginHorizontal: {
		marginHorizontal: 14
	}
});

const MessageSeparator = ({ ts, unread }: { ts?: Date | string | null; unread?: boolean }): ReactElement | null => {
	const { theme } = useTheme();

	if (!ts && !unread) {
		return null;
	}

	const date = ts ? dayjs(ts).format('LL') : null;
	const unreadLine = { backgroundColor: themes[theme].buttonBackgroundDangerDefault };
	const unreadText = { color: themes[theme].fontDanger };
	if (ts && unread) {
		return (
			<View style={styles.container}>
				<Text style={[styles.text, unreadText]}>{I18n.t('unread_messages')}</Text>
				<View style={[styles.line, unreadLine, styles.marginHorizontal]} />
				<Text style={[styles.text, unreadText]}>{date}</Text>
			</View>
		);
	}
	if (ts && date) {
		return <DateSeparator date={date} />;
	}
	return (
		<View style={styles.container}>
			<Text style={[styles.text, unreadText, styles.marginRight]}>{I18n.t('unread_messages')}</Text>
			<View style={[styles.line, unreadLine]} />
		</View>
	);
};

export default MessageSeparator;
