import React from 'react';
import {
	Text, View, StyleSheet, ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { COLOR_PRIMARY, COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	button: {
		height: 54,
		backgroundColor: COLOR_WHITE
	},
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 15,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	name: {
		fontSize: 17,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	},
	username: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center',
		color: COLOR_PRIMARY
	}
});

const UserItem = ({
	name, username, onPress, testID, onLongPress, style, icon, baseUrl, user
}) => (
	<Touch onPress={onPress} onLongPress={onLongPress} style={styles.button} testID={testID}>
		<View style={[styles.container, style]}>
			<Avatar text={username} size={30} type='d' style={styles.avatar} baseUrl={baseUrl} userId={user.id} token={user.token} />
			<View style={styles.textContainer}>
				<Text style={styles.name}>{name}</Text>
				<Text style={styles.username}>@{username}</Text>
			</View>
			{icon ? <CustomIcon name={icon} size={22} style={styles.icon} /> : null}
		</View>
	</Touch>
);

UserItem.propTypes = {
	name: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}),
	baseUrl: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	onLongPress: PropTypes.func,
	style: ViewPropTypes.style,
	icon: PropTypes.string
};

export default UserItem;
