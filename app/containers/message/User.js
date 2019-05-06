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
	},
	temp: {
		opacity: 0.3
	}
});

const User = React.memo((props) => {
	if (props.header) {
		const username = (props.useRealName && props.author.name) || props.author.username;
		const extraStyle = {};
		if (props.isTemp) {
			extraStyle.opacity = 0.3;
		}

		const aliasUsername = props.alias ? (<Text style={styles.alias}> @{username}</Text>) : null;
		const time = moment(props.ts).format(props.timeFormat);

		return (
			<View style={[styles.container, props.isTemp && styles.temp]}>
				<View style={styles.titleContainer}>
					<Text style={styles.username} numberOfLines={1}>
						{props.alias || username}
						{aliasUsername}
					</Text>
				</View>
				<Text style={messageStyles.time}>{time}</Text>
			</View>
		);
	}
	return null;
});

export default User;
