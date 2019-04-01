import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import { CustomIcon } from '../../lib/Icons';

import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	alias: {
		fontSize: 14,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	time: {
		fontSize: 12,
		paddingLeft: 10,
		lineHeight: 22,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	emptySpace: {
		marginEnd: 15
	}
});

export default class User extends React.PureComponent {
	static propTypes = {
		timeFormat: PropTypes.string.isRequired,
		username: PropTypes.string,
		alias: PropTypes.string,
		ts: PropTypes.oneOfType([
			PropTypes.instanceOf(Date),
			PropTypes.string
		]),
		temp: PropTypes.bool,
		unread: PropTypes.bool,
		Message_Read_Receipt_Enabled: PropTypes.bool
	}

	render() {
		const {
			username, alias, ts, temp, timeFormat, unread, Message_Read_Receipt_Enabled
		} = this.props;

		const extraStyle = {};
		if (temp) {
			extraStyle.opacity = 0.3;
		}

		const aliasUsername = alias ? (<Text style={styles.alias}> @{username}</Text>) : null;
		const time = moment(ts).format(timeFormat);
		let readReceipt = null;
		if (Message_Read_Receipt_Enabled) {
			readReceipt = !unread ? <CustomIcon name='check' color='#1d74f5' size={15} /> : <View style={styles.emptySpace} />;
		}

		return (
			<View style={styles.container}>
				<View style={styles.titleContainer}>
					<Text style={styles.username} numberOfLines={1}>
						{alias || username}
						{aliasUsername}
					</Text>
				</View>
				<Text style={styles.time}>{time}</Text>
				{ readReceipt }
			</View>
		);
	}
}
