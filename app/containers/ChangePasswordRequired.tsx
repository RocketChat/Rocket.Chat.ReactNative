import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { NavigationProp, NavigationState } from '@react-navigation/native';

import { logout } from '../actions/login';
import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import Button from './Button';
import { CustomIcon } from './CustomIcon';

interface IChangePasswordRequired {
	navigation: Omit<NavigationProp<any>, 'getState'> & {
		getState(): NavigationState | undefined;
	};
}

export const ChangePasswordRequired = ({ navigation }: IChangePasswordRequired) => {
	const { colors } = useTheme();
	const dispatch = useDispatch();

	const onChangePasswordPress = () => {
		navigation.navigate('ProfileStackNavigator', { screen: 'ChangePasswordView', params: { fromProfileView: false } });
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
				onPress={onChangePasswordPress}
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
