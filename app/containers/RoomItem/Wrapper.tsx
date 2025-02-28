import React from 'react';
import { View } from 'react-native';

import { DisplayMode } from '../../lib/constants';
import { useTheme } from '../../theme';
import IconOrAvatar from './IconOrAvatar';
import { IWrapperProps } from './interfaces';
import styles from './styles';
import { useRowHeight } from './useRowHeight';

const Wrapper = ({ accessibilityLabel, children, displayMode, ...props }: IWrapperProps): React.ReactElement => {
	const { colors } = useTheme();
	const { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } = useRowHeight();
	return (
		<View
			style={[styles.container, { height: displayMode === DisplayMode.Condensed ? ROW_HEIGHT_CONDENSED : ROW_HEIGHT }]}
			accessibilityLabel={accessibilityLabel}
			accessible
			accessibilityRole='button'>
			<IconOrAvatar displayMode={displayMode} {...props} />
			<View
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
