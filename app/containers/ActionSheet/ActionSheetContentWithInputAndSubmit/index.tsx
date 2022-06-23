import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import i18n from '../../../i18n';
import { isIOS } from '../../../lib/methods/helpers';
import { useTheme } from '../../../theme';
import FormTextInput from '../../TextInput/FormTextInput';
import FooterButtons from '../FooterButtons';
import sharedStyles from '../../../views/Styles';

const styles = StyleSheet.create({
	titleText: {
		fontSize: 16,
		...sharedStyles.textSemibold,
		marginBottom: 16
	},
	subtitleText: {
		fontSize: 14,
		...sharedStyles.textRegular,
		marginBottom: 10
	}
});

const ActionSheetContentWithInputAndSubmit = ({
	onSubmit = () => {},
	onCancel = () => {},
	title = '',
	description = '',
	testID = '',
	secureTextEntry = true,
	placeholder = ''
}: {
	onSubmit: (inputValue: string) => void;
	onCancel: () => void;
	title: string;
	description: string;
	testID: string;
	secureTextEntry?: boolean;
	placeholder: string;
}): React.ReactElement => {
	const { theme, colors } = useTheme();
	const [inputValue, setInputValue] = useState('');

	return (
		<View style={sharedStyles.containerScrollView}>
			<Text style={[styles.titleText, { color: colors.titleText }]}>{title}</Text>
			<Text style={[styles.subtitleText, { color: colors.titleText }]}>{description}</Text>
			<FormTextInput
				value={inputValue}
				placeholder={placeholder}
				onChangeText={value => setInputValue(value)}
				onSubmitEditing={() => onSubmit(inputValue)}
				theme={theme}
				testID={testID}
				secureTextEntry={secureTextEntry}
				inputStyle={{ borderWidth: 2 }}
				bottomSheet={isIOS}
			/>
			<FooterButtons
				confirmBackgroundColor={colors.actionTintColor}
				cancelAction={onCancel}
				confirmAction={() => onSubmit(inputValue)}
				cancelTitle={i18n.t('Cancel')}
				confirmTitle={i18n.t('Save')}
				disabled={!inputValue}
			/>
		</View>
	);
};

export default ActionSheetContentWithInputAndSubmit;
