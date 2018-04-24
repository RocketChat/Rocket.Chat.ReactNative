import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';

const styles = StyleSheet.create({
	dateSeparator: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: -5
	},
	dateSeparatorLine: {
		borderTopColor: '#eaeaea',
		borderTopWidth: StyleSheet.hairlineWidth,
		flex: 1
	},
	dateSeparatorBadge: {
		color: '#444444',
		backgroundColor: '#fff',
		fontSize: 11,
		paddingHorizontal: 10,
		transform: [{ scaleY: -1 }]
	}
});

const DateSeparator = ({ ts }) => {
	const text = moment(ts).format('MMMM DD, YYYY');
	return (
		<View style={styles.dateSeparator}>
			<View style={styles.dateSeparatorLine} />
			<Text style={styles.dateSeparatorBadge}>{text}</Text>
			<View style={styles.dateSeparatorLine} />
		</View>
	);
};

DateSeparator.propTypes = {
	ts: PropTypes.instanceOf(Date)
};

export default DateSeparator;
