import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../theme';
import Button from '../../../../containers/Button';

const styles = StyleSheet.create({
	buttonSeparator: {
		marginRight: 12,
		flex: 1
	},
	footerButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 16
	}
});

interface IFooterButtons {
	cancelAction: () => void;
	confirmAction: () => void;
	cancelTitle: string;
	confirmTitle: string;
	disabled?: boolean;
	testID: string;
	cancelBackgroundColor?: string;
	confirmBackgroundColor?: string;
}

const FooterButtons = ({
	cancelAction = () => {},
	confirmAction = () => {},
	cancelTitle = '',
	confirmTitle = '',
	disabled = false,
	cancelBackgroundColor = '',
	confirmBackgroundColor = '',
	testID = ''
}: IFooterButtons): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={styles.footerButtonsContainer}>
			<Button
				style={[styles.buttonSeparator, { backgroundColor: cancelBackgroundColor || colors.buttonBackgroundSecondaryDefault }]}
				title={cancelTitle}
				color={colors.buttonFontSecondary}
				onPress={cancelAction}
				testID={`${testID}-cancel`}
			/>
			<Button
				style={{ flex: 1, backgroundColor: confirmBackgroundColor || colors.buttonBackgroundDangerDefault }}
				title={confirmTitle}
				onPress={confirmAction}
				disabled={disabled}
				testID={`${testID}-confirm`}
			/>
		</View>
	);
};

export default FooterButtons;
