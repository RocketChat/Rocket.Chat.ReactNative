import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { OPTIONS } from './options';
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
	const insets = useSafeAreaInsets();

	const getOptions = (): React.ReactElement => (
		<View style={{ backgroundColor: colors.surfaceRoom, marginBottom: insets.bottom }}>
			<List.Separator />
			{OPTIONS[preference].map(i => (
				<React.Fragment key={i.value}>
					<List.Radio
						title={i.label}
						isSelected={option?.value === i.value}
						value={i.value}
						onPress={() => {
							hideActionSheet();
							onChangeValue({ [preference]: i.value.toString() });
						}}
					/>
					<List.Separator />
				</React.Fragment>
			))}
		</View>
	);

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label }) : option?.label;

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ children: getOptions() })}
			right={() => <Text style={[styles.pickerText, { color: colors.fontInfo }]}>{label}</Text>}
			additionalAcessibilityLabel={label}
		/>
	);
};

export default ListPicker;
