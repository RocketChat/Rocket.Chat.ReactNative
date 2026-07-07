import { forwardRef, type ComponentType, type Ref } from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import i18n from '../../i18n';

export const Handle = forwardRef<View, { onPress: () => void }>(({ onPress }, ref) => {
	'use memo';

	const { theme } = useTheme();

	// We should use RectButton from gesture-handler to avoid issues with the keyboard
	return (
		<RectButton
			ref={ref as Ref<ComponentType>}
			onPress={onPress}
			style={styles.handle}
			testID='action-sheet-handle'
			accessible
			accessibilityRole='button'
			accessibilityLabel={i18n.t('A11y_close_action_sheet')}
			accessibilityHint={i18n.t('A11y_close_action_sheet_hint')}>
			<View style={[styles.handleIndicator, { backgroundColor: themes[theme].fontSecondaryInfo }]} />
		</RectButton>
	);
});
