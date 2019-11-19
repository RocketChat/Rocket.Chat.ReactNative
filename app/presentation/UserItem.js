import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton, LongPressGestureHandler, State } from 'react-native-gesture-handler';

import Avatar from '../containers/Avatar';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { COLOR_PRIMARY, themes } from '../constants/colors';

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
	name, username, onPress, testID, onLongPress, style, icon, baseUrl, user, theme
}) => {
	const longPress = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE) {
			onLongPress();
		}
	};

	return (
		<LongPressGestureHandler
			onHandlerStateChange={longPress}
			minDurationMs={800}
		>
			<RectButton
				onPress={onPress}
				underlayColor={themes[theme].bannerBackground}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				activeOpacity={1}
				testID={testID}
			>
				<View style={[styles.container, styles.button, style]}>
					<Avatar text={username} size={30} type='d' style={styles.avatar} baseUrl={baseUrl} userId={user.id} token={user.token} />
					<View style={styles.textContainer}>
						<Text style={[styles.name, { color: themes[theme].titleText }]}>{name}</Text>
						<Text style={[styles.username, { color: themes[theme].auxiliaryText }]}>@{username}</Text>
					</View>
					{icon ? <CustomIcon name={icon} size={22} style={styles.icon} /> : null}
				</View>
			</RectButton>
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
