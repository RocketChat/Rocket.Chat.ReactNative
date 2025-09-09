import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { MediaDownloadOption } from '../../lib/constants';

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

type TOPTIONS = { label: string; value: MediaDownloadOption }[];

const OPTIONS: TOPTIONS = [
	{
		label: 'Wi_Fi_and_mobile_data',
		value: 'wifi_mobile_data'
	},
	{
		label: 'Wi_Fi',
		value: 'wifi'
	},
	{
		label: 'Never',
		value: 'never'
	}
];

interface IBaseParams {
	value: string;
	onChangeValue: (value: MediaDownloadOption) => void;
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
	const option = OPTIONS.find(option => option.value === value) || OPTIONS[2];

	const getOptions = (): TActionSheetOptionsItem[] =>
		OPTIONS.map(i => ({
			title: I18n.t(i.label, { defaultValue: i.label }),
			onPress: () => {
				hideActionSheet();
				onChangeValue(i.value);
			},
			right: option.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.strokeHighlight} /> : undefined
		}));

	/* when picking an option the label should be Never but when showing among the other settings the label should be Off */
	const label = option.label === 'Never' ? I18n.t('Off') : I18n.t(option.label);

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
					<Text style={[styles.rightTitle, { color: colors.fontHint }]}>{label}</Text>
				</View>
			)}
			rightContainerStyle={styles.rightContainer}
			additionalAcessibilityLabel={label}
		/>
	);
};

export default ListPicker;
