import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DisplayMode } from '../../lib/constants/constantDisplayMode';
import { useTheme } from '../../theme';
import IconOrAvatar from './IconOrAvatar';
import { type IWrapperProps } from './interfaces';
import styles from './styles';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const Wrapper = ({ accessibilityLabel, children, displayMode, ...props }: IWrapperProps): React.ReactElement => {
	const { colors } = useTheme();
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	const borderWidth = Math.max(StyleSheet.hairlineWidth || 0, 0.5);
	return (
		<View
			style={[styles.container, { height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }]}
			accessibilityLabel={accessibilityLabel}
			accessible
			accessibilityRole='button'>
			<IconOrAvatar displayMode={displayMode} {...props} />
			<View
				style={[
					styles.centerContainer,
					{
						borderColor: colors.strokeLight,
						borderBottomWidth: borderWidth
					}
				]}>
				{children}
			</View>
		</View>
	);
};

export default Wrapper;
