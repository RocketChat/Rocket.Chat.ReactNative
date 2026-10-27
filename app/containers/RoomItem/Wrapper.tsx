import { type ReactElement } from 'react';
import { View } from 'react-native';

import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import IconOrAvatar from './IconOrAvatar';
import { type IWrapperProps } from './interfaces';
import styles from './styles';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

const Wrapper = ({
	accessibilityLabel,
	accessibilityHint,
	children,
	displayMode,
	testID,
	avatar,
	type,
	rid,
	showAvatar,
	showLastMessage
}: IWrapperProps): ReactElement => {
	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();
	const isExpandedWithLastMessage = displayMode === DisplayMode.Expanded && showLastMessage;
	return (
		<View
			style={[
				styles.container,
				isExpandedWithLastMessage && styles.containerTopAligned,
				{ height: displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight }
			]}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			testID={testID}
			accessible
			accessibilityRole='button'>
			<IconOrAvatar avatar={avatar} type={type} rid={rid} showAvatar={showAvatar} />
			<View style={styles.centerContainer}>{children}</View>
		</View>
	);
};

export default Wrapper;
