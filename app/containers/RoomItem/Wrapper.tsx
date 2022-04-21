import React from 'react';
import { View } from 'react-native';

import { DisplayMode, themes } from '../../lib/constants';
import IconOrAvatar from './IconOrAvatar';
import { IWrapperProps } from './interfaces';
import styles from './styles';

const Wrapper = ({ accessibilityLabel, theme, children, displayMode, ...props }: IWrapperProps): React.ReactElement => (
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
