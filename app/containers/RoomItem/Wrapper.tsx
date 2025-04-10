import React from 'react';
import { KeyboardExtendedView } from 'react-native-external-keyboard';

import { DisplayMode } from '../../lib/constants';
import { useTheme } from '../../theme';
import IconOrAvatar from './IconOrAvatar';
import { IWrapperProps } from './interfaces';
import styles from './styles';
import { useRowHeight } from '../../lib/hooks/useRowHeight';

const Wrapper = ({ accessibilityLabel, children, displayMode, ...props }: IWrapperProps): React.ReactElement => {
	const { colors } = useTheme();
	const { rowHeight, rowHeightCondensed } = useRowHeight();
	return (
		<KeyboardExtendedView
			focusable={false}
			style={[styles.container, { height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }]}
			accessibilityLabel={accessibilityLabel}
			accessible
			accessibilityRole='button'>
			<IconOrAvatar displayMode={displayMode} {...props} />
			<KeyboardExtendedView
				focusable={false}
				style={[
					styles.centerContainer,
					{
						borderColor: colors.strokeLight
					}
				]}>
				{children}
			</KeyboardExtendedView>
		</KeyboardExtendedView>
	);
};

export default Wrapper;
