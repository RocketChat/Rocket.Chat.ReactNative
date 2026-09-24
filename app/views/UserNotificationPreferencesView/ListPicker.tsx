import { StyleSheet, Text, View } from 'react-native';
import { Fragment, useContext, type ReactElement } from 'react';

import * as List from '~/containers/List';
import { asNativeListRow } from '~/containers/List/nativeListRow';
import { NativeListContext } from '~/containers/List/NativeListContext';
import NativeListPicker from '~/containers/List/NativeListPicker';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '../Styles';
import { OPTIONS } from './options';
import { useActionSheet } from '~/containers/ActionSheet';

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
	const nativeListMode = useContext(NativeListContext);
	const option = value ? OPTIONS[preference].find(option => option.value === value) : OPTIONS[preference][0];

	const getOptions = (): ReactElement => (
		<View style={{ backgroundColor: colors.surfaceRoom }}>
			<List.Separator />
			{OPTIONS[preference].map(i => (
				<Fragment key={i.value}>
					<List.Radio
						title={i.label}
						isSelected={option?.value === i.value}
						value={i.value}
						onPress={() => {
							hideActionSheet();
							onChangeValue({ [preference]: i.value.toString() });
						}}
						testID={`notification-preferences-${preference}-${i.value}`}
					/>
					<List.Separator />
				</Fragment>
			))}
		</View>
	);

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label }) : option?.label;

	if (nativeListMode === 'native') {
		return (
			<NativeListPicker
				title={I18n.t(title)}
				testID={testID}
				options={OPTIONS[preference].map(i => ({
					label: I18n.t(i.label, { defaultValue: i.label }),
					value: i.value.toString(),
					testID: `notification-preferences-${preference}-${i.value}`
				}))}
				selection={option?.value.toString() ?? ''}
				onSelectionChange={selected => onChangeValue({ [preference]: selected })}
			/>
		);
	}

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ children: getOptions() })}
			right={() => <Text style={[styles.pickerText, { color: colors.fontInfo }]}>{label}</Text>}
			additionalAccessibilityLabel={label}
		/>
	);
};

export default asNativeListRow(ListPicker);
