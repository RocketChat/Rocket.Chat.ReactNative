import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CustomIcon, TIconsName } from '../../CustomIcon';
import i18n from '../../../i18n';
import { isIOS } from '../../../lib/methods/helpers';
import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';
import Button from '../../Button';
import { FormTextInput } from '../../TextInput/FormTextInput';
import { useActionSheet } from '../Provider';

const styles = StyleSheet.create({
	subtitleText: {
		fontSize: 14,
		...sharedStyles.textRegular,
		marginBottom: 10
	},
	buttonSeparator: {
		marginRight: 8
	},
	footerButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 16
	},
	titleContainerText: {
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	titleContainer: {
		paddingRight: 80,
		marginBottom: 16,
		flexDirection: 'row',
		alignItems: 'center'
	}
});

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

const ActionSheetContentWithInputAndSubmit = ({
	onSubmit = () => {},
	onCancel,
	title = '',
	description = '',
	testID = '',
	secureTextEntry = true,
	placeholder = '',
	confirmTitle,
	iconName,
	iconColor,
	customText,
	confirmBackgroundColor,
	showInput = true
}: {
	onSubmit: (inputValue: string) => void;
	onCancel?: () => void;
	title: string;
	description: string;
	testID: string;
	secureTextEntry?: boolean;
	placeholder: string;
	confirmTitle?: string;
	iconName?: TIconsName;
	iconColor?: string;
	customText?: React.ReactElement;
	confirmBackgroundColor?: string;
	showInput?: boolean;
}): React.ReactElement => {
	const { colors } = useTheme();
	const [inputValue, setInputValue] = useState('');
	const { hideActionSheet } = useActionSheet();

	return (
		<View style={sharedStyles.containerScrollView} testID='action-sheet-content-with-input-and-submit'>
			<>
				<View style={styles.titleContainer}>
					{iconName ? <CustomIcon name={iconName} size={32} color={iconColor || colors.dangerColor} /> : null}
					<Text style={[styles.titleContainerText, { color: colors.passcodePrimary, paddingLeft: iconName ? 16 : 0 }]}>
						{title}
					</Text>
				</View>
				<Text style={[styles.subtitleText, { color: colors.titleText }]}>{description}</Text>
				{customText}
			</>
			{showInput ? (
				<FormTextInput
					value={inputValue}
					placeholder={placeholder}
					onChangeText={value => setInputValue(value)}
					onSubmitEditing={() => {
						// fix android animation
						setTimeout(() => {
							hideActionSheet();
						}, 100);
						if (inputValue) onSubmit(inputValue);
					}}
					testID={testID}
					secureTextEntry={secureTextEntry}
					bottomSheet={isIOS}
				/>
			) : null}
			<FooterButtons
				confirmBackgroundColor={confirmBackgroundColor || colors.actionTintColor}
				cancelAction={onCancel || hideActionSheet}
				confirmAction={() => onSubmit(inputValue)}
				cancelTitle={i18n.t('Cancel')}
				confirmTitle={confirmTitle || i18n.t('Save')}
				disabled={!showInput ? false : !inputValue}
			/>
		</View>
	);
};

export default ActionSheetContentWithInputAndSubmit;
