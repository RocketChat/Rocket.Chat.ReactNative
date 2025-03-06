import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
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

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ options: getOptions() })}
			right={() => <Text style={[styles.title, { color: colors.fontHint }]}>{label}</Text>}
			additionalAcessibilityLabel={label}
		/>
	);
};

export default ListPicker;
