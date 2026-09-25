import { Fragment, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useActionSheet } from '~/containers/ActionSheet';
import * as List from '~/containers/List';
import { asNativeListRow } from '~/containers/List/native/rowMarkers';
import { useNativeListMode } from '~/containers/List/native/context';
import NativeListPicker from '~/containers/List/native/Picker';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '../Styles';
import { type MediaDownloadOption } from '~/lib/constants/mediaAutoDownload';

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
	testID,
	onChangeValue
}: {
	title: string;
	testID: string;
} & IBaseParams) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();
	const nativeListMode = useNativeListMode();
	const option = OPTIONS.find(option => option.value === value) || OPTIONS[2];

	const getOptions = (): ReactElement => (
		<View style={{ backgroundColor: colors.surfaceRoom }}>
			<List.Separator />
			{OPTIONS.map(i => (
				<Fragment key={i.value}>
					<List.Radio
						onPress={() => {
							hideActionSheet();
							onChangeValue(i.value);
						}}
						title={i.label}
						value={i.value}
						isSelected={option.value === i.value}
						testID={`${testID}-${i.value}`}
					/>
					<List.Separator />
				</Fragment>
			))}
		</View>
	);

	/* when picking an option the label should be Never but when showing among the other settings the label should be Off */
	const label = option.label === 'Never' ? I18n.t('Off') : I18n.t(option.label);

	if (nativeListMode === 'native') {
		return (
			<NativeListPicker
				title={title}
				testID={testID}
				options={OPTIONS.map(i => ({ label: I18n.t(i.label), value: i.value, testID: `${testID}-${i.value}` }))}
				selection={option.value}
				onSelectionChange={selected => onChangeValue(selected as MediaDownloadOption)}
			/>
		);
	}

	return (
		<List.Item
			testID={testID}
			onPress={() => showActionSheet({ children: getOptions() })}
			title={title}
			translateTitle={false}
			right={() => (
				<View style={styles.rightTitleContainer}>
					<Text style={[styles.rightTitle, { color: colors.fontHint }]}>{label}</Text>
				</View>
			)}
			rightContainerStyle={styles.rightContainer}
			additionalAccessibilityLabel={label}
		/>
	);
};

export default asNativeListRow(ListPicker);
