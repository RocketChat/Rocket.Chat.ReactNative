import { useContext, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import { CustomIcon } from '~/containers/CustomIcon';
import * as List from '~/containers/List';
import { asNativeListRow } from '~/containers/List/nativeListRow';
import { NativeListContext } from '~/containers/List/NativeListContext';
import NativeListPicker from '~/containers/List/NativeListPicker';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	title: { ...sharedStyles.textRegular, fontSize: 16 }
});

const OPTIONS = {
	alsoSendThreadToChannel: [
		{
			label: 'Default',
			value: 'default'
		},
		{
			label: 'Always',
			value: 'always'
		},
		{
			label: 'Never',
			value: 'never'
		}
	]
};

type TOptions = keyof typeof OPTIONS;

interface IBaseParams {
	preference: TOptions;
	value: string;
	onChangeValue: (param: { [key: string]: string }, onError: () => void) => void;
}

const ListPicker = ({
	preference,
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
	const nativeListMode = useContext(NativeListContext);
	const [option, setOption] = useState(
		value ? OPTIONS[preference].find(option => option.value === value) : OPTIONS[preference][0]
	);

	const getOptions = (): TActionSheetOptionsItem[] =>
		OPTIONS[preference].map(i => ({
			title: I18n.t(i.label, { defaultValue: i.label }),
			onPress: () => {
				hideActionSheet();
				onChangeValue({ [preference]: i.value.toString() }, () => setOption(option));
				setOption(i);
			},
			right: option?.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.fontHint} /> : undefined
		}));

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label }) : option?.label;

	if (nativeListMode === 'native') {
		return (
			<NativeListPicker
				title={I18n.t(title)}
				testID={testID}
				options={OPTIONS[preference].map(i => ({ label: I18n.t(i.label, { defaultValue: i.label }), value: i.value }))}
				selection={option?.value ?? ''}
				onSelectionChange={selected => {
					const previous = option;
					onChangeValue({ [preference]: selected }, () => setOption(previous));
					setOption(OPTIONS[preference].find(i => i.value === selected));
				}}
			/>
		);
	}

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ options: getOptions() })}
			right={() => <Text style={[styles.title, { color: colors.fontHint }]}>{label}</Text>}
			additionalAccessibilityLabel={label}
		/>
	);
};

export default asNativeListRow(ListPicker);
