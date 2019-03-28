import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';

import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 16,
		marginBottom: 4,
		marginHorizontal: 14
	},
	line: {
		backgroundColor: '#9ea2a8',
		height: 1,
		flex: 1
	},
	text: {
		color: '#9ea2a8',
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	unreadLine: {
		backgroundColor: '#f5455c'
	},
	unreadText: {
		color: '#f5455c'
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

const DateSeparator = React.memo(({ ts, unread }) => {
	const date = ts ? moment(ts).format('MMM DD, YYYY') : null;
	if (ts && unread) {
		return (
			<View style={styles.container}>
				<Text style={[styles.text, styles.unreadText]}>{I18n.t('unread_messages')}</Text>
				<View style={[styles.line, styles.unreadLine, styles.marginHorizontal]} />
				<Text style={[styles.text, styles.unreadText]}>{date}</Text>
			</View>
		);
	}
	if (ts) {
		return (
			<View style={styles.container}>
				<View style={styles.line} />
				<Text style={[styles.text, styles.marginLeft]}>{date}</Text>
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<Text style={[styles.text, styles.unreadText, styles.marginRight]}>{I18n.t('unread_messages')}</Text>
			<View style={[styles.line, styles.unreadLine]} />
		</View>
	);
});

DateSeparator.propTypes = {
	ts: PropTypes.instanceOf(Date),
	unread: PropTypes.bool
};

export default DateSeparator;
