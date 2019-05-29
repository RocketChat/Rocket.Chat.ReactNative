import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';

import sharedStyles from '../../views/Styles';
import messageStyles from './styles';

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
		temp: PropTypes.bool
	}

	render() {
		const {
			username, alias, ts, temp, timeFormat
		} = this.props;

		const extraStyle = {};
		if (temp) {
			extraStyle.opacity = 0.3;
		}

		const aliasUsername = alias ? (<Text style={styles.alias}> @{username}</Text>) : null;
		const time = moment(ts).format(timeFormat);

		return (
			<View style={styles.container}>
				<View style={styles.titleContainer}>
					<Text style={styles.username} numberOfLines={1}>
						{alias || username}
						{aliasUsername}
					</Text>
				</View>
				<Text style={messageStyles.time}>{time}</Text>
			</View>
		);
	}
}
