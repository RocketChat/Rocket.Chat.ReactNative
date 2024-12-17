import React, { useState, useRef } from 'react';
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
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24
	},
	buttonSeparator: {
		marginRight: 12
	},
	footerButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 16
	},
	titleContainerText: {
		...sharedStyles.textBold,
		fontSize: 16,
		lineHeight: 24
	},
	titleContainer: {
		paddingRight: 80,
		marginBottom: 12,
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
	confirmBackgroundColor = '',
	testID = ''
}): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={styles.footerButtonsContainer}>
			<Button
				style={[
					styles.buttonSeparator,
					{ flex: 1, backgroundColor: cancelBackgroundColor || colors.buttonBackgroundSecondaryDefault }
				]}
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
	showInput = true,
	inputs = [],
	isDisabled
}: {
	onSubmit: (inputValue: string | string[]) => void;
	onCancel?: () => void;
	title: string;
	description?: string;
	testID: string;
	secureTextEntry?: boolean;
	placeholder?: string;
	confirmTitle?: string;
	iconName?: TIconsName;
	iconColor?: string;
	customText?: React.ReactElement;
	confirmBackgroundColor?: string;
	showInput?: boolean;
	inputs?: { placeholder: string; secureTextEntry?: boolean; key: string }[];
	isDisabled?: (inputValues: string[]) => boolean;
}): React.ReactElement => {
	const { colors } = useTheme();
	const [inputValues, setInputValues] = useState(inputs.map(() => ''));
	const inputRefs = useRef(inputs.map(() => React.createRef()));

	const handleInputChange = (value: string, index: number) => {
		const newInputValues = [...inputValues];
		newInputValues[index] = value;
		setInputValues(newInputValues);
	};

	const { hideActionSheet } = useActionSheet();

	const renderInputs = () => {
		if (inputs.length > 0) {
			return inputs.map((inputConfig, index) => (
				<FormTextInput
					key={inputConfig.key}
					value={inputValues[index]}
					onChangeText={value => handleInputChange(value, index)}
					onSubmitEditing={() => {
						if (index < inputs.length - 1) {
							(inputRefs.current[index + 1] as any).current.focus();
						} else {
							setTimeout(() => {
								hideActionSheet();
							}, 100);
							if (inputValues.every(value => value)) onSubmit(inputValues);
						}
					}}
					inputRef={inputRefs.current[index] as any}
					testID={`${testID}-input-${inputConfig.key}`}
					secureTextEntry={inputConfig.secureTextEntry}
					bottomSheet={isIOS}
				/>
			));
		}

		return (
			<FormTextInput
				value={inputValues[0]}
				onChangeText={value => handleInputChange(value, 0)}
				onSubmitEditing={() => {
					setTimeout(() => {
						hideActionSheet();
					}, 100);
					if (inputValues[0]) onSubmit(inputValues[0]);
				}}
				accessibilityLabel={placeholder}
				testID={`${testID}-input`}
				secureTextEntry={secureTextEntry}
				bottomSheet={isIOS}
				containerStyle={{ marginTop: 12, marginBottom: 36 }}
			/>
		);
	};

	const defaultDisabled = showInput && inputValues.some(value => !value);
	const disabled = isDisabled ? isDisabled(inputValues) : defaultDisabled;

	return (
		<View style={sharedStyles.containerScrollView} testID='action-sheet-content-with-input-and-submit'>
			<>
				<View accessible accessibilityLabel={title} style={styles.titleContainer}>
					{iconName ? <CustomIcon name={iconName} size={32} color={iconColor || colors.buttonBackgroundDangerDefault} /> : null}
					<Text style={[styles.titleContainerText, { color: colors.fontDefault, paddingLeft: iconName ? 12 : 0 }]}>{title}</Text>
				</View>
				{description ? <Text style={[styles.subtitleText, { color: colors.fontTitlesLabels }]}>{description}</Text> : null}
				{customText}
			</>
			{showInput ? renderInputs() : null}
			<FooterButtons
				confirmBackgroundColor={confirmBackgroundColor || colors.fontHint}
				cancelAction={onCancel || hideActionSheet}
				confirmAction={() => onSubmit(inputs.length > 0 ? inputValues : inputValues[0])}
				cancelTitle={i18n.t('Cancel')}
				confirmTitle={confirmTitle || i18n.t('Save')}
				disabled={disabled}
				testID={testID}
			/>
		</View>
	);
};

export default ActionSheetContentWithInputAndSubmit;
