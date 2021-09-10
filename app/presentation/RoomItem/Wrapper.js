import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import IconOrAvatar from './IconOrAvatar';
import { DISPLAY_MODE_CONDENSED } from '../../constants/constantDisplayMode';

const Wrapper = ({
	accessibilityLabel,
	theme,
	children,
	displayMode,
	...props
}) => (
	<View
		style={[
			styles.container,
			displayMode === DISPLAY_MODE_CONDENSED && styles.containerCondensed
		]}
		accessibilityLabel={accessibilityLabel}
	>
		<IconOrAvatar
			theme={theme}
			displayMode={displayMode}
			{...props}
		/>
		<View
			style={[
				styles.centerContainer,
				{
					borderColor: themes[theme].separatorColor
				},
				displayMode === DISPLAY_MODE_CONDENSED && styles.condensedPaddingVertical
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
	children: PropTypes.element,
	showAvatar: PropTypes.bool,
	displayMode: PropTypes.string,
	prid: PropTypes.string,
	status: PropTypes.string,
	isGroupChat: PropTypes.bool,
	teamMain: PropTypes.bool,
	showLastMessage: PropTypes.bool
};

export default Wrapper;
