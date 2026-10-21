import { type ReactElement } from 'react';
import { View } from 'react-native';

import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import IconOrAvatar from './IconOrAvatar';
import { type IWrapperProps } from './interfaces';
import styles from './styles';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import I18n from '~/i18n';

const Wrapper = ({ accessibilityLabel, onShowActions, children, displayMode, testID, ...props }: IWrapperProps): ReactElement => {
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	const isExpandedWithLastMessage = displayMode === DisplayMode.Expanded && props.showLastMessage;
	return (
		<View
			style={[
				styles.container,
				isExpandedWithLastMessage && styles.containerTopAligned,
				{ height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }
			]}
			accessibilityLabel={accessibilityLabel}
			testID={testID}
			accessible
			accessibilityRole='button'
			accessibilityActions={onShowActions ? [{ name: 'showActions', label: I18n.t('Show_room_actions') }] : undefined}
			onAccessibilityAction={
				onShowActions
					? event => {
							if (event.nativeEvent.actionName === 'showActions') onShowActions();
						}
					: undefined
			}>
			<IconOrAvatar displayMode={displayMode} {...props} />
			<View style={styles.centerContainer}>{children}</View>
		</View>
	);
};

export default Wrapper;
