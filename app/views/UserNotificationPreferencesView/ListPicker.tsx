import { Text, View } from 'react-native';
import { Fragment, type ReactElement } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { OPTIONS } from './options';
import { useActionSheet } from '../../containers/ActionSheet';

const styles = StyleSheet.create((theme, rt) => ({
	optionsContainer: {
		backgroundColor: theme.colors.surfaceRoom,
		marginBottom: rt.insets.bottom
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		color: theme.colors.fontInfo
	}
}));

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
	const option = value ? OPTIONS[preference].find(option => option.value === value) : OPTIONS[preference][0];

	const getOptions = (): ReactElement => (
		<View style={styles.optionsContainer}>
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

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ children: getOptions() })}
			right={() => <Text style={styles.pickerText}>{label}</Text>}
			additionalAccessibilityLabel={label}
		/>
	);
};

export default ListPicker;
