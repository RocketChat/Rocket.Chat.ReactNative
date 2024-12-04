import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Tip from './Tip';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	PasswordTipsTitle: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	tips: {
		gap: 8,
		paddingTop: 8
	}
});

interface IPasswordTips {
	isDirty: boolean;
	password: string;
}

const PasswordTips = ({ isDirty, password }: IPasswordTips) => {
	const { colors } = useTheme();

	const atLeastEightCharactersValidation = /^.{8,}$/;
	const atMostTwentyFourCharactersValidation = /^.{0,24}$/;
	const maxTwoRepeatingCharacters = /^(?!.*(.)\1\1)/;
	const atLeastOneLowercaseLetter = /[a-z]/;
	const atLeastOneNumber = /\d/;
	const atLeastOneSymbol = /[^a-zA-Z0-9]/;

	const selectTipIconType = (validation: RegExp) => {
		if (!isDirty) return 'info';

		if (validation.test(password)) return 'success';

		return 'error';
	};

	return (
		<View accessible>
			<Text
				accessibilityLabel={i18n.t('Your_Password_Must_Have')}
				accessible
				style={[styles.PasswordTipsTitle, { color: colors.fontDefault }]}>
				{i18n.t('Your_Password_Must_Have')}
			</Text>
			<View style={styles.tips}>
				<Tip iconType={selectTipIconType(atLeastEightCharactersValidation)} description={i18n.t('At_Least_8_Characters')} />
				<Tip iconType={selectTipIconType(atMostTwentyFourCharactersValidation)} description={i18n.t('At_Most_24_Characters')} />
				<Tip iconType={selectTipIconType(maxTwoRepeatingCharacters)} description={i18n.t('Max_2_Repeating_Characters')} />
				<Tip iconType={selectTipIconType(atLeastOneLowercaseLetter)} description={i18n.t('At_Least_1_Lowercase_Letter')} />
				<Tip iconType={selectTipIconType(atLeastOneNumber)} description={i18n.t('At_Least_1_Number')} />
				<Tip iconType={selectTipIconType(atLeastOneSymbol)} description={i18n.t('At_Least_1_Symbol')} />
			</View>
		</View>
	);
};

export default PasswordTips;
