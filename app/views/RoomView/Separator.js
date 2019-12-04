import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';

import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';

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
	marginLeft: {
		marginLeft: 14
	},
	marginRight: {
		marginRight: 14
	},
	marginHorizontal: {
		marginHorizontal: 14
	}
});

const DateSeparator = React.memo(({ ts, unread, theme }) => {
	const date = ts ? moment(ts).format('MMM DD, YYYY') : null;
	const unreadLine = { backgroundColor: themes[theme].dangerColor };
	const unreadText = { color: themes[theme].dangerColor };
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
				<View style={[styles.line, { backgroundColor: themes[theme].borderColor }]} />
				<Text style={[styles.text, { color: themes[theme].auxiliaryText }, styles.marginLeft]}>{date}</Text>
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<Text style={[styles.text, unreadText, styles.marginRight]}>{I18n.t('unread_messages')}</Text>
			<View style={[styles.line, unreadLine]} />
		</View>
	);
});

DateSeparator.propTypes = {
	ts: PropTypes.instanceOf(Date),
	unread: PropTypes.bool,
	theme: PropTypes.string
};

export default DateSeparator;
