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
}) => {
	const { colors } = useTheme();
	return (
		<View style={styles.footerButtonsContainer}>
			<Button
				style={{ flex: 1, backgroundColor: cancelBackgroundColor || colors.passcodeButtonActive }}
				color={colors.bodyText}
				title={cancelTitle}
				onPress={cancelAction}
			/>
			<View style={{ width: 8 }} />
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
