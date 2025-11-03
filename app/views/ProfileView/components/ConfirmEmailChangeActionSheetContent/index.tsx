import React from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../Styles';
import Button from '../../../../containers/Button';
import { ControlledFormTextInput } from '../../../../containers/TextInput';
import { useActionSheet } from '../../../../containers/ActionSheet';

const styles = StyleSheet.create({
	subtitleText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24,
		paddingBottom: 8
	},
	button: { flex: 1 },
	footerButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 16,
		gap: 12
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
	confirmBackgroundColor = ''
}): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={styles.footerButtonsContainer}>
			<Button
				style={[styles.button, { backgroundColor: cancelBackgroundColor || colors.buttonBackgroundSecondaryDefault }]}
				title={cancelTitle}
				color={colors.buttonFontSecondary}
				onPress={cancelAction}
				testID='profile-view-enter-password-sheet-cancel'
			/>
			<Button
				style={[styles.button, { backgroundColor: confirmBackgroundColor || colors.buttonBackgroundDangerDefault }]}
				title={confirmTitle}
				onPress={confirmAction}
				disabled={disabled}
				testID='profile-view-enter-password-sheet-confirm'
			/>
		</View>
	);
};

const ConfirmEmailChangeActionSheetContent = ({
	onSubmit = () => {}
}: {
	onSubmit: (inputValue: string) => void;
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
		<View style={sharedStyles.containerScrollView} testID='profile-view-enter-password-sheet'>
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
				testID='profile-view-enter-password-sheet-input'
				secureTextEntry
				bottomSheet={true}
				containerStyle={styles.inputContainer}
				error={errors.password?.message}
			/>
			<FooterButtons
				confirmBackgroundColor={colors.fontHint}
				cancelAction={hideActionSheet}
				confirmAction={onConfirm}
				cancelTitle={I18n.t('Cancel')}
				confirmTitle={I18n.t('Save')}
			/>
		</View>
	);
};

export default ConfirmEmailChangeActionSheetContent;
