import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActionSheet } from '../../containers/ActionSheet';
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
	const insets = useSafeAreaInsets();
	const option = OPTIONS.find(option => option.value === value) || OPTIONS[2];

	const getOptions = () => (
		<View style={{ backgroundColor: colors.surfaceRoom, marginBottom: insets.bottom }}>
			{OPTIONS.map(i => (
				<List.Radio
					onPress={() => {
						hideActionSheet();
						onChangeValue(i.value);
					}}
					title={i.label}
					value={i.value}
					isSelected={option.value === i.value}
				/>
			))}
		</View>
	);

	/* when picking an option the label should be Never but when showing among the other settings the label should be Off */
	const label = option.label === 'Never' ? I18n.t('Off') : I18n.t(option.label);

	return (
		<List.Item
			onPress={() => showActionSheet({ children: getOptions() })}
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
