import React from 'react';
import { View } from 'react-native';

import { themes } from '../../constants/colors';
import { DisplayMode } from '../../constants/constantDisplayMode';
import IconOrAvatar from './IconOrAvatar';
import styles from './styles';

interface IWrapper {
	accessibilityLabel: string;
	avatar: string;
	avatarSize: number;
	type: string;
	theme: string;
	rid: string;
	children: JSX.Element;
	displayMode: string;
	prid: string;
	showLastMessage: boolean;
	status: string;
	isGroupChat: boolean;
	teamMain: boolean;
	showAvatar: boolean;
}

const Wrapper = ({ accessibilityLabel, theme, children, displayMode, ...props }: IWrapper) => (
	<View
		style={[styles.container, displayMode === DisplayMode.Condensed && styles.containerCondensed]}
		accessibilityLabel={accessibilityLabel}>
		<IconOrAvatar theme={theme} displayMode={displayMode} {...props} />
		<View
			style={[
				styles.centerContainer,
				{
					borderColor: themes[theme].separatorColor
				},
				displayMode === DisplayMode.Condensed && styles.condensedPaddingVertical
			]}>
			{children}
		</View>
	</View>
);

export default Wrapper;
