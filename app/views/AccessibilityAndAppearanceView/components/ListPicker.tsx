import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../../containers/ActionSheet';
import { CustomIcon } from '../../../containers/CustomIcon';
import * as List from '../../../containers/List';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

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

type TOPTIONS = { label: string; description: string | null }[];

const OPTIONS: TOPTIONS = [
	{
		label: I18n.t('A11y_appearance_toasts'),
		description: null
	},
	{
		label: I18n.t('A11y_appearance_dialogs'),
		description: I18n.t('A11y_appearance_dialog_require_manual_dismissal')
	}
];

interface IBaseParams {
	value: string;
	onChangeValue: (value: string) => void;
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
	const option = OPTIONS.find(option => option.label === value) || OPTIONS[2];

	const getOptions = (): TActionSheetOptionsItem[] =>
		OPTIONS.map(i => ({
			title: i.label,
			subtitle: i?.description || undefined,
			onPress: () => {
				hideActionSheet();
				onChangeValue(i.label as string);
			},
			right: option?.label === i.label ? () => <CustomIcon name={'check'} size={20} color={colors.strokeHighlight} /> : undefined
		}));

	return (
		<List.Item
			onPress={() => showActionSheet({ options: getOptions() })}
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
