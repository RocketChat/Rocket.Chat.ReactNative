import { type ReactElement } from 'react';
import { View, type AccessibilityActionEvent } from 'react-native';

import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { useTheme } from '~/theme';
import IconOrAvatar from './IconOrAvatar';
import { type IWrapperProps } from './interfaces';
import styles from './styles';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useRoomItemAccessibilityActions } from './useRoomItemAccessibilityActions';

const Wrapper = ({
	accessibilityLabel,
	accessibilityHint,
	onLongPress,
	children,
	displayMode,
	...props
}: IWrapperProps): ReactElement => {
	const { colors } = useTheme();
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	const accessibilityActions = useRoomItemAccessibilityActions();

	const onAccessibilityAction = (event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === 'showActions') {
			onLongPress?.();
		}
	};
	return (
		<View
			style={[styles.container, { height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }]}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessible
			accessibilityRole='button'
			accessibilityActions={accessibilityActions}
			onAccessibilityAction={accessibilityActions ? onAccessibilityAction : undefined}>
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
