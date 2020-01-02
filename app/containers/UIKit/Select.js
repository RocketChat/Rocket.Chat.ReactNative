import React from 'react';
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
		paddingVertical: 16
	},
	viewContainer: {
		marginVertical: 4,
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
	theme
}) => {
	const items = options.map(option => ({ label: textParser([option.text]).pop(), value: option.value }));
	const pickerStyle = {
		...styles.viewContainer,
		...(isIOS ? styles.iosPadding : {}),
		borderColor: themes[theme].auxiliaryTintColor,
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
			placeholder={placeholder ? { label: textParser([placeholder]).pop(), value: null } : {}}
			useNativeAndroidPickerStyle={false}
			onValueChange={value => onChange({ value })}
			style={{
				viewContainer: pickerStyle,
				inputAndroidContainer: pickerStyle
			}}
			Icon={Icon}
			textInputProps={{ style: { ...styles.pickerText, color: themes[theme].auxiliaryText } }}
		/>
	);
};
Select.propTypes = {
	options: PropTypes.array,
	placeholder: PropTypes.string,
	onChange: PropTypes.func,
	loading: PropTypes.bool,
	theme: PropTypes.string
};
