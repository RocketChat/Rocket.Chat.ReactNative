import React from 'react';
import { View } from 'react-native';

import { themes } from '../../constants/colors';
import { DisplayMode } from '../../constants/constantDisplayMode';
import IconOrAvatar from './IconOrAvatar';
import { IWrapper } from './interfaces';
import styles from './styles';

const Wrapper = ({ accessibilityLabel, theme, children, displayMode, ...props }: IWrapper): React.ReactElement => (
	<View
		style={[styles.container, displayMode === DisplayMode.Condensed && styles.containerCondensed]}
		accessibilityLabel={accessibilityLabel}>
		<IconOrAvatar theme={theme} displayMode={displayMode} {...props} />
		<View
			style={[
				styles.centerContainer,
				{
					borderColor: themes[theme].separatorColor
				}
			]}>
			{children}
		</View>
	</View>
);

export default Wrapper;
