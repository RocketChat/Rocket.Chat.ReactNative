import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../../containers/ActionSheet';
import { CustomIcon } from '../../../containers/CustomIcon';
import * as List from '../../../containers/List';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';
import { TAlertDisplayType } from '..';

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

type TOPTIONS = { label: string; value: TAlertDisplayType; description: string | null }[];

interface IBaseParams {
	value: TAlertDisplayType;
	onChangeValue: (value: TAlertDisplayType) => void;
}

const ListPicker = ({
	value,
	title,
	onChangeValue
}: {
	title: string;
} & IBaseParams) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const OPTIONS: TOPTIONS = useMemo(
		() => [
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
		],
		[I18n.locale]
	);

	const option = OPTIONS.find(option => option.value === value) || OPTIONS[0];

	const getOptions = (): TActionSheetOptionsItem[] =>
		OPTIONS.map(i => ({
			title: i.label,
			subtitle: i?.description || undefined,
			accessibilityLabel: `${i.label}. ${i?.description || ''}. ${
				option?.value === i.value ? I18n.t('Checked') : I18n.t('Unchecked')
			}`,
			onPress: () => {
				hideActionSheet();
				onChangeValue(i.value);
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
