import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { CustomIcon } from '../CustomIcon';
import { textParser } from './utils';
import { isAndroid, isIOS } from '../../lib/methods/helpers';
import ActivityIndicator from '../ActivityIndicator';
import { useTheme } from '../../theme';
import { IText, Option } from './interfaces';

const styles = StyleSheet.create({
	iosPadding: {
		height: 48,
		justifyContent: 'center'
	},
	viewContainer: {
		marginBottom: 16,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderRadius: 4,
		justifyContent: 'center'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	icon: {
		right: 16
	},
	loading: {
		padding: 0
	}
});

interface ISelect {
	options?: Option[];
	placeholder?: IText;
	onChange: Function;
	loading: boolean;
	disabled?: boolean;
	value: [];
}

export const Select = ({ options = [], placeholder, onChange, loading, disabled, value: initialValue }: ISelect) => {
	const { theme } = useTheme();
	const [selected, setSelected] = useState(!Array.isArray(initialValue) && initialValue);
	const items = options.map(option => ({ label: textParser([option.text]), value: option.value }));
	const pickerStyle = {
		...styles.viewContainer,
		...(isIOS ? styles.iosPadding : {}),
		borderColor: themes[theme].strokeLight,
		backgroundColor: themes[theme].surfaceRoom
	};

	const placeholderObject = useMemo(
		() =>
			placeholder && !items.some(item => item.label === textParser([placeholder]))
				? { label: textParser([placeholder]), value: null }
				: {},
		[items.length, placeholder?.text]
	);

	const Icon = () =>
		loading ? (
			<ActivityIndicator style={styles.loading} />
		) : (
			<CustomIcon size={22} name='chevron-down' style={isAndroid && styles.icon} color={themes[theme].fontSecondaryInfo} />
		);

	return (
		<RNPickerSelect
			items={items}
			placeholder={placeholderObject}
			useNativeAndroidPickerStyle={false}
			value={selected}
			disabled={disabled}
			onValueChange={value => {
				onChange({ value });
				setSelected(value);
			}}
			style={{
				viewContainer: pickerStyle,
				inputAndroidContainer: pickerStyle
			}}
			Icon={Icon}
			textInputProps={{
				// style property was Omitted in lib, but can be used normally
				// @ts-ignore
				style: { ...styles.pickerText, color: selected ? themes[theme].fontTitlesLabels : themes[theme].fontSecondaryInfo }
			}}
		/>
	);
};
