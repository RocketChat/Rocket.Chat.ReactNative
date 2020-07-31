import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar';

const RoomItemInner = ({
	accessibilityLabel,
	avatar,
	avatarSize,
	type,
	baseUrl,
	userId,
	token,
	theme,
	children
}) => (
	<View
		style={styles.container}
		accessibilityLabel={accessibilityLabel}
	>
		<Avatar
			text={avatar}
			size={avatarSize}
			type={type}
			baseUrl={baseUrl}
			style={styles.avatar}
			userId={userId}
			token={token}
		/>
		<View
			style={[
				styles.centerContainer,
				{
					borderColor: themes[theme].separatorColor
				}
			]}
		>
			{children}
		</View>
	</View>
);

RoomItemInner.propTypes = {
	accessibilityLabel: PropTypes.string,
	avatar: PropTypes.string,
	avatarSize: PropTypes.number,
	type: PropTypes.string,
	baseUrl: PropTypes.string,
	userId: PropTypes.string,
	token: PropTypes.string,
	theme: PropTypes.string,
	children: PropTypes.element
};

export default RoomItemInner;
