import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import { CustomIcon } from '~/containers/CustomIcon';
import * as List from '~/containers/List';
import { asNativeListRow } from '~/containers/List/native/rowMarkers';
import { NativeListContext } from '~/containers/List/native/context';
import NativeListPicker from '~/containers/List/native/Picker';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { type TAlertDisplayType } from '..';

const styles = StyleSheet.create({
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
	const nativeListMode = useContext(NativeListContext);

	const OPTIONS: TOPTIONS = [
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

	if (nativeListMode === 'native') {
		return (
			<NativeListPicker
				title={title}
				options={OPTIONS.map(i => ({ label: i.label, value: i.value }))}
				selection={option.value}
				onSelectionChange={selected => onChangeValue(selected as TAlertDisplayType)}
			/>
		);
	}

	const openOptions = () => {
		const options = getOptions();
		showActionSheet({ options });
	};
	return (
		<List.Item
			accessibilityLabel={`${title}. ${option?.label}`}
			onPress={openOptions}
			title={title}
			translateTitle={false}
			right={() => (
				<View style={styles.rightTitleContainer}>
					<Text style={[styles.rightTitle, { color: colors.fontInfo }]}>{option?.label}</Text>
				</View>
			)}
			rightContainerStyle={styles.rightContainer}
			additionalAccessibilityLabel={option?.label}
		/>
	);
};

export default asNativeListRow(ListPicker);
