import { Fragment, type ReactElement } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useActionSheet } from '../../containers/ActionSheet';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { type MediaDownloadOption } from '../../lib/constants/mediaAutoDownload';

const styles = StyleSheet.create((theme, rt) => ({
	leftTitleContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start'
	},
	leftTitle: {
		...sharedStyles.textMedium,
		fontSize: 16,
		lineHeight: 24,
		color: theme.colors.fontDefault
	},
	rightContainer: {
		flex: 1
	},
	rightTitle: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24,
		color: theme.colors.fontHint
	},
	rightTitleContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-end'
	},
	optionsContainer: {
		backgroundColor: theme.colors.surfaceRoom,
		marginBottom: rt.insets.bottom
	}
}));

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
	const option = OPTIONS.find(option => option.value === value) || OPTIONS[2];

	const getOptions = (): ReactElement => (
		<View style={styles.optionsContainer}>
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

	return (
		<List.Item
			testID={testID}
			onPress={() => showActionSheet({ children: getOptions() })}
			title={() => (
				<View style={styles.leftTitleContainer}>
					<Text style={styles.leftTitle}>{title}</Text>
				</View>
			)}
			right={() => (
				<View style={styles.rightTitleContainer}>
					<Text style={styles.rightTitle}>{label}</Text>
				</View>
			)}
			rightContainerStyle={styles.rightContainer}
			additionalAccessibilityLabel={label}
		/>
	);
};

export default ListPicker;
