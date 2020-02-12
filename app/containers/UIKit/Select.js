import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { textParser } from './utils';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import ActivityIndicator from '../ActivityIndicator';

const styles = StyleSheet.create({
	iosPadding: {
		height: 48,
		justifyContent: 'center'
	},
	viewContainer: {
		marginBottom: 16,
		paddingHorizontal: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 2,
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

export const Select = ({
	options = [],
	placeholder,
	onChange,
	loading,
	disabled,
	value: initialValue,
	theme
}) => {
	const [selected, setSelected] = useState(!Array.isArray(initialValue) && initialValue);
	const items = options.map(option => ({ label: textParser([option.text]), value: option.value }));
	const pickerStyle = {
		...styles.viewContainer,
		...(isIOS ? styles.iosPadding : {}),
		borderColor: themes[theme].separatorColor,
		backgroundColor: themes[theme].backgroundColor
	};

	const Icon = () => (
		loading
			? <ActivityIndicator style={styles.loading} />
			: <CustomIcon size={22} name='arrow-down' style={isAndroid && styles.icon} color={themes[theme].auxiliaryText} />
	);

	return (
		<RNPickerSelect
			items={items}
			placeholder={placeholder ? { label: textParser([placeholder]), value: null } : {}}
			useNativeAndroidPickerStyle={false}
			value={selected}
			disabled={disabled}
			onValueChange={(value) => {
				onChange({ value });
				setSelected(value);
			}}
			style={{
				viewContainer: pickerStyle,
				inputAndroidContainer: pickerStyle
			}}
			Icon={Icon}
			textInputProps={{ style: { ...styles.pickerText, color: selected ? themes[theme].titleText : themes[theme].auxiliaryText } }}
		/>
	);
};
Select.propTypes = {
	options: PropTypes.array,
	placeholder: PropTypes.string,
	onChange: PropTypes.func,
	loading: PropTypes.bool,
	disabled: PropTypes.bool,
	value: PropTypes.array,
	theme: PropTypes.string
};
