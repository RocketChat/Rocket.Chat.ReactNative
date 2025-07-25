import React from 'react';
import { TextInputProps } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useDispatch } from 'react-redux';

import { inviteLinksSetParams } from '../../actions/inviteLinks';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks';
import I18n from '../../i18n';
import styles from './styles';
import { events, logEvent } from '../../lib/methods/helpers/log';

const OPTIONS = {
	days: [
		{
			label: '1',
			value: 1
		},
		{
			label: '7',
			value: 7
		},
		{
			label: '15',
			value: 15
		},
		{
			label: '30',
			value: 30
		}
	],
	maxUses: [
		{
			label: '1',
			value: 1
		},
		{
			label: '5',
			value: 5
		},
		{
			label: '10',
			value: 10
		},
		{
			label: '25',
			value: 25
		},
		{
			label: '50',
			value: 50
		},
		{
			label: '100',
			value: 100
		}
	]
};

const Picker = ({ param, first }: { param: 'days' | 'maxUses'; first: string }): JSX.Element => {
	const { colors } = useTheme();
	const inviteLinkParam = useAppSelector(state => state.inviteLinks[param]);
	const dispatch = useDispatch();

	const onValueChangePicker = (value: number) => {
		logEvent(events.IU_EDIT_SET_LINK_PARAM);
		const params = {
			[param]: value
		};
		dispatch(inviteLinksSetParams(params));
	};

	const textInputStyle: TextInputProps = { style: { ...styles.pickerText, color: colors.fontHint } };
	const firstEl = [
		{
			label: I18n.t(first),
			value: 0
		}
	];
	return (
		<RNPickerSelect
			style={{ viewContainer: styles.viewContainer }}
			value={inviteLinkParam}
			textInputProps={textInputStyle}
			useNativeAndroidPickerStyle={false}
			onValueChange={value => onValueChangePicker(value)}
			items={firstEl.concat(OPTIONS[param])}
		/>
	);
};

export default Picker;
