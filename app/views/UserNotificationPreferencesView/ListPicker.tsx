import React from 'react';
import { StyleSheet, Text } from 'react-native';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { OPTIONS } from './options';
import { CustomIcon } from '../../containers/CustomIcon';
import { useActionSheet } from '../../containers/ActionSheet';

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

type TKey = 'desktopNotifications' | 'pushNotifications' | 'emailNotificationMode';

interface IBaseParams {
	preference: TKey;
	value: string;
	onChangeValue: (param: { [key: string]: string }) => void;
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
	const option = value ? OPTIONS[preference].find(option => option.value === value) : OPTIONS[preference][0];

	const getOptions = () =>
		OPTIONS[preference].map(i => ({
			title: I18n.t(i.label, { defaultValue: i.label }),
			onPress: () => {
				hideActionSheet();
				onChangeValue({ [preference]: i.value.toString() });
			},
			right: option?.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.fontHint} /> : undefined
		}));

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label }) : option?.label;

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ options: getOptions() })}
			right={() => <Text style={[styles.pickerText, { color: colors.fontHint }]}>{label}</Text>}
			additionalAcessibilityLabel={label}
		/>
	);
};

export default ListPicker;
