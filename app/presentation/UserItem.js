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
	name, username, onPress, testID, onLongPress
}) => (
	<Touch onPress={onPress} onLongPress={onLongPress} style={styles.button} testID={testID}>
		<View style={styles.container}>
			<Avatar text={username} size={30} type='d' style={styles.avatar} />
			<View style={styles.textContainer}>
				<Text style={styles.name}>{name}</Text>
				<Text style={styles.username}>@{username}</Text>
			</View>
		</View>
	</Touch>
);

UserItem.propTypes = {
	name: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	onLongPress: PropTypes.func
};

export default UserItem;
