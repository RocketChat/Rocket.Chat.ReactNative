import React from 'react';
import { Text, View, StyleSheet, Platform, ViewPropTypes, Image } from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch';

const styles = StyleSheet.create({
	button: {
		height: 54,
		backgroundColor: '#fff'
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
		marginBottom: 1,
		textAlign: 'left'
	},
	username: {
		fontSize: 14,
		color: '#9EA2A8'
	},
	icon: {
		width: 20,
		height: 20,
		marginHorizontal: 15,
		resizeMode: 'contain',
		alignSelf: 'center'
	}
});

const UserItem = ({
	name, username, onPress, testID, onLongPress, style, icon, baseUrl
}) => (
	<Touch onPress={onPress} onLongPress={onLongPress} style={styles.button} testID={testID}>
		<View style={[styles.container, style]}>
			<Avatar text={username} size={30} type='d' style={styles.avatar} baseUrl={baseUrl} />
			<View style={styles.textContainer}>
				<Text style={styles.name}>{name}</Text>
				<Text style={styles.username}>@{username}</Text>
			</View>
			{icon ? <Image source={{ uri: icon }} style={styles.icon} /> : null}
		</View>
	</Touch>
);

UserItem.propTypes = {
	name: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	baseUrl: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	onLongPress: PropTypes.func,
	style: ViewPropTypes.style,
	icon: PropTypes.string
};

export default UserItem;
