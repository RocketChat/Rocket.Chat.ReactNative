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
		marginBottom: 25,
		marginTop: 15,
		transform: [{ scaleY: -1 }]
	},
	line: {
		backgroundColor: '#9ea2a8',
		height: 1,
		flex: 1
	},
	text: {
		color: '#9ea2a8',
		fontSize: 14,
		fontWeight: '600'
	},
	unreadLine: {
		backgroundColor: '#f5455c'
	},
	unreadText: {
		color: '#f5455c'
	},
	marginLeft: {
		marginLeft: 10
	},
	marginRight: {
		marginRight: 10
	},
	marginHorizontal: {
		marginHorizontal: 10
	}
});

const DateSeparator = ({ ts, unread }) => {
	const date = ts ? moment(ts).format('MMM DD, YYYY') : null;
	if (ts && unread) {
		return (
			<View style={styles.container}>
				<Text style={[styles.text, styles.unreadText, styles.marginLeft]}>{date}</Text>
				<View style={[styles.line, styles.unreadLine, styles.marginHorizontal]} />
				<Text style={[styles.text, styles.unreadText, styles.marginRight]}>{I18n.t('unread_messages')}</Text>
			</View>
		);
	}
	if (ts) {
		return (
			<View style={styles.container}>
				<View style={[styles.line, styles.marginLeft]} />
				<Text style={[styles.text, styles.marginHorizontal]}>{date}</Text>
				<View style={[styles.line, styles.marginRight]} />
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<View style={[styles.line, styles.unreadLine, styles.marginLeft]} />
			<Text style={[styles.text, styles.unreadText, styles.marginHorizontal]}>{I18n.t('unread_messages')}</Text>
			<View style={[styles.line, styles.unreadLine, styles.marginRight]} />
		</View>
	);
};

DateSeparator.propTypes = {
	ts: PropTypes.instanceOf(Date),
	unread: PropTypes.bool
};

export default DateSeparator;
