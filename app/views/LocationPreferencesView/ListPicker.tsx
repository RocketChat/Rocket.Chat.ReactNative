import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { MapProviderName } from '../LocationShare/services/mapProviders';

const styles = StyleSheet.create({
	title: { ...sharedStyles.textRegular, fontSize: 16 }
});

const OPTIONS: { label: string; value: MapProviderName }[] = [
	{
		label: 'OpenStreetMap',
		value: 'osm'
	},
	{
		label: 'Google_Maps',
		value: 'google'
	}
];

interface IListPickerProps {
	title: string;
	value: MapProviderName;
	onChangeValue: (value: MapProviderName) => void;
	testID?: string;
}

const ListPicker = ({ title, value, onChangeValue, testID }: IListPickerProps) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();
	const [option, setOption] = useState(
		value ? OPTIONS.find(option => option.value === value) : OPTIONS[0]
	);

	const getOptions = (): TActionSheetOptionsItem[] =>
		OPTIONS.map(i => ({
			title: I18n.t(i.label, { defaultValue: i.label }),
			onPress: () => {
				hideActionSheet();
				onChangeValue(i.value);
				setOption(i);
			},
			right: option?.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.fontHint} /> : undefined
		}));

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label }) : option?.label;

	return (
		<List.Item
			title={title}
			{...(testID && { testID })}
			onPress={() => showActionSheet({ options: getOptions() })}
			right={() => <Text style={[styles.title, { color: colors.fontSecondaryInfo }]}>{label}</Text>}
		/>
	);
};

export default ListPicker;