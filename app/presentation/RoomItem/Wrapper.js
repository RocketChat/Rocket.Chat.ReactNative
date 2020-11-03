import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar/Avatar';

const Wrapper = ({
	accessibilityLabel,
	avatar,
	avatarSize,
	avatarETag,
	type,
	baseUrl,
	userId,
	token,
	theme,
	rid,
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
			style={styles.avatar}
			server={baseUrl}
			user={{ id: userId, token }}
			avatarETag={avatarETag}
			rid={rid}
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

Wrapper.propTypes = {
	accessibilityLabel: PropTypes.string,
	avatar: PropTypes.string,
	avatarSize: PropTypes.number,
	avatarETag: PropTypes.string,
	type: PropTypes.string,
	baseUrl: PropTypes.string,
	userId: PropTypes.string,
	token: PropTypes.string,
	theme: PropTypes.string,
	rid: PropTypes.string,
	children: PropTypes.element
};

export default Wrapper;
