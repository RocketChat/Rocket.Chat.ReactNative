import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

import Avatar from '../containers/Avatar';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';
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
		flexDirection: 'column',
		justifyContent: 'center'
	},
	name: {
		fontSize: 17,
		...sharedStyles.textMedium
	},
	username: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center'
	}
});

const UserItem = ({
	name, username, onPress, testID, onLongPress, style, icon, baseUrl, user, theme
}) => {
	const longPress = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE) {
			if (onLongPress) {
				onLongPress();
			}
		}
	};

	return (
		<LongPressGestureHandler
			onHandlerStateChange={longPress}
			minDurationMs={800}
		>
			<Touch
				onPress={onPress}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID={testID}
				theme={theme}
			>
				<View style={[styles.container, styles.button, style]}>
					<Avatar text={username} size={30} type='d' style={styles.avatar} baseUrl={baseUrl} userId={user.id} token={user.token} />
					<View style={styles.textContainer}>
						<Text style={[styles.name, { color: themes[theme].titleText }]} numberOfLines={1}>{name}</Text>
						<Text style={[styles.username, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>@{username}</Text>
					</View>
					{icon ? <CustomIcon name={icon} size={22} style={[styles.icon, { color: themes[theme].actionTintColor }]} /> : null}
				</View>
			</Touch>
		</LongPressGestureHandler>
	);
};

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
	style: PropTypes.any,
	icon: PropTypes.string,
	theme: PropTypes.string
};

export default UserItem;
