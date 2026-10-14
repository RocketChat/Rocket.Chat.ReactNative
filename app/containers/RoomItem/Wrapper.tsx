import { type ReactElement } from 'react';
import { View } from 'react-native';

import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { useTheme } from '~/theme';
import IconOrAvatar from './IconOrAvatar';
import { type IWrapperProps } from './interfaces';
import styles from './styles';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import I18n from '~/i18n';

const Wrapper = ({
	accessibilityLabel,
	accessibilityHint,
	onLongPress,
	children,
	displayMode,
	testID,
	...props
}: IWrapperProps): ReactElement => {
	const { colors } = useTheme();
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	return (
		<View
			style={[styles.container, { height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }]}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			testID={testID}
			accessible
			accessibilityRole='button'
			accessibilityActions={onLongPress ? [{ name: 'showActions', label: I18n.t('Show_room_actions') }] : undefined}
			onAccessibilityAction={event => {
				if (event.nativeEvent.actionName === 'showActions') onLongPress?.();
			}}>
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
