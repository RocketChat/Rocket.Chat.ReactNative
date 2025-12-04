import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type TActionSheetOptionsItem, useActionSheet } from '../../../containers/ActionSheet';
import { CustomIcon } from '../../../containers/CustomIcon';
import * as List from '../../../containers/List';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';
import { type TAlertDisplayType, type TEnterKeyBehavior } from '..';

const styles = StyleSheet.create({
	leftTitleContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start'
	},
	leftTitle: {
		...sharedStyles.textMedium,
		fontSize: 16,
		lineHeight: 24
	},
	rightContainer: {
		flex: 1
	},
	rightTitle: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24
	},
	rightTitleContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-end'
	}
});

type TAlertOptions = { label: string; value: TAlertDisplayType; description: string | null }[];
type TEnterKeyOptions = { label: string; value: TEnterKeyBehavior; description: string | null }[];

interface IBaseParams<T> {
	value: T;
	onChangeValue: (value: T) => void;
}

const ListPicker = <T extends TAlertDisplayType | TEnterKeyBehavior>({
	value,
	title,
	onChangeValue,
	type
}: {
	title: string;
	type?: 'alert' | 'enterKey';
} & IBaseParams<T>) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const ALERT_OPTIONS: TAlertOptions = [
		{
			label: I18n.t('A11y_appearance_toasts'),
			value: 'TOAST' as TAlertDisplayType,
			description: I18n.t('A11y_appearance_toast_dismissed_automatically')
		},
		{
			label: I18n.t('A11y_appearance_dialogs'),
			value: 'DIALOG' as TAlertDisplayType,
			description: I18n.t('A11y_appearance_dialog_require_manual_dismissal')
		}
	];

	const ENTER_KEY_OPTIONS: TEnterKeyOptions = [
		{
			label: I18n.t('Enter_key_send_message'),
			value: 'SEND' as TEnterKeyBehavior,
			description: null
		},
		{
			label: I18n.t('Enter_key_new_line'),
			value: 'NEW_LINE' as TEnterKeyBehavior,
			description: null
		}
	];

	const OPTIONS = type === 'enterKey' ? ENTER_KEY_OPTIONS : ALERT_OPTIONS;

	const option = OPTIONS.find(option => option.value === value) || (OPTIONS[0] as typeof OPTIONS[0]);

	const getOptions = (): TActionSheetOptionsItem[] =>
		OPTIONS.map(i => ({
			title: i.label,
			subtitle: i?.description || undefined,
			accessibilityLabel: `${i.label}. ${i?.description || ''}. ${
				option?.value === i.value ? I18n.t('Checked') : I18n.t('Unchecked')
			}`,
			onPress: () => {
				hideActionSheet();
				onChangeValue(i.value as T);
			},
			right: option?.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.strokeHighlight} /> : undefined
		}));

	const openOptions = () => {
		const options = getOptions();
		showActionSheet({ options });
	};
	return (
		<List.Item
			accessibilityLabel={`${title}. ${option?.label}`}
			onPress={openOptions}
			title={() => (
				<View style={styles.leftTitleContainer}>
					<Text style={[styles.leftTitle, { color: colors.fontDefault }]}>{title}</Text>
				</View>
			)}
			right={() => (
				<View style={styles.rightTitleContainer}>
					<Text style={[styles.rightTitle, { color: colors.fontInfo }]}>{option?.label}</Text>
				</View>
			)}
			rightContainerStyle={styles.rightContainer}
			additionalAcessibilityLabel={option?.label}
		/>
	);
};

export default ListPicker;
