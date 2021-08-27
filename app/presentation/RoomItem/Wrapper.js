import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar';

const Wrapper = ({
	accessibilityLabel,
	avatar,
	avatarSize,
	type,
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
	type: PropTypes.string,
	theme: PropTypes.string,
	rid: PropTypes.string,
	children: PropTypes.element
};

export default Wrapper;
