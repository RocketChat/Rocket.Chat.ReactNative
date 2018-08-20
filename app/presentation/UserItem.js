import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch';

const styles = StyleSheet.create({
	button: {
		height: 54
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
		flexDirection: 'column'
	},
	name: {
		fontSize: 18,
		color: '#0C0D0F',
		marginTop: Platform.OS === 'ios' ? 6 : 3,
		marginBottom: 1
	},
	username: {
		fontSize: 14,
		color: '#9EA2A8'
	}
});

const UserItem = ({
	user, onPress, onLongPress
}) => (
	<Touch onPress={onPress} onLongPress={onLongPress} style={styles.button}>
		<View style={styles.container}>
			<Avatar text={user.name} size={30} type={user.type} style={styles.avatar} />
			<View style={styles.textContainer}>
				<Text style={styles.name}>{user.fname}</Text>
				<Text style={styles.username}>@{user.name}</Text>
			</View>
		</View>
	</Touch>
);

UserItem.propTypes = {
	user: PropTypes.object.isRequired,
	onPress: PropTypes.func.isRequired,
	onLongPress: PropTypes.func
};

export default UserItem;
