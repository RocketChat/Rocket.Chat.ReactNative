import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 10
	},
	line: {
		borderTopColor: '#eaeaea',
		borderTopWidth: StyleSheet.hairlineWidth,
		flex: 1
	},
	text: {
		color: '#444444',
		fontSize: 11,
		paddingHorizontal: 10,
		transform: [{ scaleY: -1 }]
	},
	unreadLine: {
		borderTopColor: 'red'
	},
	unreadText: {
		color: 'red'
	}
});

const DateSeparator = ({ ts, unread }) => {
	const date = ts ? moment(ts).format('MMMM DD, YYYY') : null;
	if (ts && unread) {
		return (
			<View style={styles.container}>
				<Text style={[styles.text, styles.unreadText]}>{date}</Text>
				<View style={[styles.line, styles.unreadLine]} />
				<Text style={[styles.text, styles.unreadText]}>{I18n.t('unread_messages')}</Text>
			</View>
		);
	}
	if (ts) {
		return (
			<View style={styles.container}>
				<View style={styles.line} />
				<Text style={styles.text}>{date}</Text>
				<View style={styles.line} />
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<View style={[styles.line, styles.unreadLine]} />
			<Text style={[styles.text, styles.unreadText]}>{I18n.t('unread_messages')}</Text>
		</View>
	);
};

DateSeparator.propTypes = {
	ts: PropTypes.instanceOf(Date),
	unread: PropTypes.bool
};

export default DateSeparator;
