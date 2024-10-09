import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import moment from 'moment';

import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { themes } from '../lib/constants';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 16,
		marginBottom: 4,
		marginHorizontal: 14
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

const MessageSeparator = ({ ts, unread }: { ts?: Date | string | null; unread?: boolean }): React.ReactElement | null => {
	const { theme } = useTheme();

	if (!ts && !unread) {
		return null;
	}

	const date = ts ? moment(ts).format('LL') : null;
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
	if (ts) {
		return (
			<View style={styles.container}>
				<View style={[styles.line, { backgroundColor: themes[theme].strokeLight }]} />
				<Text style={[styles.text, { color: themes[theme].fontSecondaryInfo }, styles.marginHorizontal]}>{date}</Text>
				<View style={[styles.line, { backgroundColor: themes[theme].strokeLight }]} />
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<Text style={[styles.text, unreadText, styles.marginRight]}>{I18n.t('unread_messages')}</Text>
			<View style={[styles.line, unreadLine]} />
		</View>
	);
};

export default MessageSeparator;
