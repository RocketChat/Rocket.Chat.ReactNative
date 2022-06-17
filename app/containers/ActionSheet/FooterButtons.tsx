import React from 'react';
import { View } from 'react-native';

import Button from '../Button';
import { useTheme } from '../../theme';
import styles from './styles';

const FooterButtons = ({
	cancelAction = () => {},
	confirmAction = () => {},
	cancelTitle = '',
	confirmTitle = '',
	disabled = false,
	cancelBackgroundColor = '',
	confirmBackgroundColor = ''
}): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={styles.footerButtonsContainer}>
			<Button
				style={[styles.buttonSeparator, { flex: 1, backgroundColor: cancelBackgroundColor || colors.cancelButton }]}
				color={colors.backdropColor}
				title={cancelTitle}
				onPress={cancelAction}
			/>
			<Button
				style={{ flex: 1, backgroundColor: confirmBackgroundColor || colors.dangerColor }}
				title={confirmTitle}
				onPress={confirmAction}
				disabled={disabled}
			/>
		</View>
	);
};

export default FooterButtons;
