import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import i18n from '../../../../i18n';
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
			<Text style={styles.titleText}>{i18n.t('Please_enter_your_password')}</Text>
			<Text style={styles.subtitleText}>{i18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}</Text>
			<FormTextInput
				value={password}
				placeholder={i18n.t('Password')}
				onChangeText={value => setPassword(value)}
				onSubmitEditing={() => onSubmit(password)}
				theme={theme}
				testID='profile-view-enter-password-sheet'
				secureTextEntry
				inputStyle={{ borderWidth: 2 }}
			/>
			<FooterButtons
				confirmBackgroundColor={colors.actionTintColor}
				cancelAction={onCancel}
				cancelTitle={i18n.t('Cancel')}
				confirmTitle={i18n.t('Save')}
			/>
		</View>
	);
};

export default EnterPasswordSheet;
