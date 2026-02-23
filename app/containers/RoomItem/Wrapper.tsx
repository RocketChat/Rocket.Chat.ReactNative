import React from 'react';
import { KeyboardExtendedBaseView } from 'react-native-external-keyboard';
import { View as RNView, Platform } from 'react-native';

import { DisplayMode } from '../../lib/constants/constantDisplayMode';
import { useTheme } from '../../theme';
import IconOrAvatar from './IconOrAvatar';
import { type IWrapperProps } from './interfaces';
import styles from './styles';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const View = Platform.OS === 'android' ? KeyboardExtendedBaseView : RNView;

const Wrapper = ({ accessibilityLabel, children, displayMode, ...props }: IWrapperProps): React.ReactElement => {
	const { colors } = useTheme();
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	return (
		<View
			focusable={false}
			style={[styles.container, { height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }]}
			accessibilityLabel={accessibilityLabel}
			accessible
			accessibilityRole='button'>
			<IconOrAvatar displayMode={displayMode} {...props} />
			<View
				focusable={false}
				style={[
					styles.centerContainer,
					{
						borderColor: colors.strokeLight
					}
				]}>
				{children}
			</View>
		</View>
	);
};

export default Wrapper;
