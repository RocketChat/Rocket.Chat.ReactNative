import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../../../i18n';
import FormTextInput from '../../../../containers/TextInput/FormTextInput';
import FooterButtons from '../../../../containers/ActionSheet/FooterButtons';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../Styles';

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

const EnterPasswordSheet = ({
	onSubmit = () => {},
	onCancel = () => {}
}: {
	onSubmit: (password: string) => void;
	onCancel: () => void;
}) => {
	const { theme, colors } = useTheme();
	const [password, setPassword] = useState('');

	return (
		<View style={sharedStyles.containerScrollView}>
			<Text style={styles.titleText}>{I18n.t('Please_enter_your_password')}</Text>
			<Text style={styles.subtitleText}>{I18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}</Text>
			<FormTextInput
				value={password}
				placeholder={I18n.t('Password')}
				onChangeText={value => setPassword(value)}
				onSubmitEditing={() => onSubmit(password)}
				theme={theme}
				testID='profile-view-enter-password-sheet'
				secureTextEntry
				inputStyle={{ borderWidth: 2 }}
				bottomSheet
			/>
			<FooterButtons
				confirmBackgroundColor={colors.actionTintColor}
				cancelAction={onCancel}
				confirmAction={() => onSubmit(password)}
				cancelTitle={I18n.t('Cancel')}
				confirmTitle={I18n.t('Save')}
				disabled={!password}
			/>
		</View>
	);
};

export default EnterPasswordSheet;
