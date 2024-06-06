import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { logout, setUser } from '../actions/login';
import I18n from '../i18n';
import { useSetting } from '../lib/hooks/useSetting';
import { showErrorAlert } from '../lib/methods/helpers';
import { Services } from '../lib/services';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { useActionSheet } from './ActionSheet';
import ActionSheetContentWithInputAndSubmit from './ActionSheet/ActionSheetContentWithInputAndSubmit';
import Button from './Button';
import { CustomIcon } from './CustomIcon';

export const ChangePasswordRequired = () => {
	const [loading, setLoading] = useState(false);
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
	const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder') as string;
	const passwordConfirmationPlaceholder = useSetting('Accounts_ConfirmPasswordPlaceholder') as string;

	const changePassword = async (password: string) => {
		setLoading(true);
		try {
			await Services.setUserPassword(password);
			dispatch(setUser({ requirePasswordChange: false }));
			hideActionSheet();
		} catch (error: any) {
			showErrorAlert(error?.reason || error?.message, I18n.t('Oops'));
		}
		setLoading(false);
	};

	const showActionSheetPassword = () => {
		const inputs = [{ placeholder: passwordPlaceholder || I18n.t('Password'), secureTextEntry: true, key: 'password' }];
		if (requiresPasswordConfirmation) {
			inputs.push({
				placeholder: passwordConfirmationPlaceholder || I18n.t('Confirm_your_password'),
				secureTextEntry: true,
				key: 'confirm-password'
			});
		}
		showActionSheet({
			children: (
				<ActionSheetContentWithInputAndSubmit
					title={I18n.t('Please_Enter_your_new_password')}
					testID='change-password-required-sheet'
					inputs={inputs}
					onSubmit={input => changePassword(input[0])}
					isDisabled={input => (loading || input[0] === '' || requiresPasswordConfirmation ? input[0] !== input[1] : false)}
				/>
			)
		});
	};

	return (
		<View style={[styles.container, { paddingTop: 120, backgroundColor: colors.surfaceLight }]}>
			<View style={styles.iconContainer}>
				<CustomIcon name='info' size={36} color={colors.statusFontWarning} />
			</View>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('You_need_to_change_your_password')}</Text>
			<Text style={[styles.description, { color: colors.fontDefault }]}>{I18n.t('To_continue_using_RocketChat')}</Text>
			<Button
				testID='change-password-required-button'
				title={I18n.t('Change_password')}
				type='primary'
				onPress={showActionSheetPassword}
			/>
			<Button
				testID='change-password-required-logout'
				title={I18n.t('Logout')}
				type='secondary'
				backgroundColor={colors.surfaceTint}
				onPress={() => dispatch(logout())}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#fff'
	},
	iconContainer: {
		alignItems: 'center',
		padding: 24
	},
	title: {
		fontSize: 20,
		lineHeight: 30,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textRegular
	}
});
