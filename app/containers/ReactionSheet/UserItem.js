import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import Avatar from '../Avatar';
import { themes } from '../../constants/colors';
import styles from './styles';

export const UserItem = React.memo(({
	user, baseUrl, theme, userId, userToken
}) => {
	const IMG_SIZE = 45;
	return (
		<View
			style={styles.userItem}
		>
			<Avatar
				style={styles.avatar}
				text={user}
				size={IMG_SIZE}
				baseUrl={baseUrl}
				userId={userId}
				token={userToken}
				theme={theme}
			/>
			<Text style={[styles.userItemText, { color: themes[theme].bodyText }]}>{user}</Text>
		</View>
	);
});

UserItem.propTypes = {
	user: PropTypes.string,
	baseUrl: PropTypes.string,
	theme: PropTypes.string,
	userId: PropTypes.string,
	userToken: PropTypes.string
};
