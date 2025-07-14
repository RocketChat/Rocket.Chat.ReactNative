import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import I18n from '../../../../i18n';
import { isIOS } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../Styles';
import Button from '../../../../containers/Button';
import { ControlledFormTextInput } from '../../../../containers/TextInput';
import { useActionSheet } from '../../../../containers/ActionSheet';

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
	inputContainer: {
		marginBottom: 0,
		marginTop: 0
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

const ConfirmEmailChangeActionSheetContent = ({
	onSubmit = () => {},
	testID = '',
	confirmTitle
}: {
	onSubmit: (inputValue: string) => void;
	testID: string;
	secureTextEntry?: boolean;
	placeholder?: string;
	confirmTitle?: string;
}): React.ReactElement => {
	const { colors } = useTheme();
	const {
		control,
		getValues,
		formState: { errors }
	} = useForm({ defaultValues: { password: '' } });

	const { hideActionSheet } = useActionSheet();

	const onConfirm = () => {
		const { password } = getValues();
		onSubmit(password);
	};

	return (
		<View style={sharedStyles.containerScrollView} testID='action-sheet-content-with-input-and-submit'>
			<View accessible accessibilityLabel={I18n.t('Please_enter_your_password')} style={styles.titleContainer}>
				<Text style={[styles.titleContainerText, { color: colors.fontDefault }]}>{I18n.t('Please_enter_your_password')}</Text>
			</View>
			<Text style={[styles.subtitleText, { color: colors.fontTitlesLabels }]}>
				{I18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
			</Text>
			<ControlledFormTextInput
				control={control}
				name='password'
				onSubmitEditing={onConfirm}
				accessibilityLabel={I18n.t('Password')}
				autoComplete='password'
				testID='profile-view-delete-account-sheet-input'
				secureTextEntry
				bottomSheet={isIOS}
				containerStyle={styles.inputContainer}
				error={errors.password?.message}
			/>
			<FooterButtons
				confirmBackgroundColor={colors.fontHint}
				cancelAction={hideActionSheet}
				confirmAction={onConfirm}
				cancelTitle={I18n.t('Cancel')}
				confirmTitle={confirmTitle || I18n.t('Save')}
				testID={testID}
			/>
		</View>
	);
};

export default ConfirmEmailChangeActionSheetContent;
