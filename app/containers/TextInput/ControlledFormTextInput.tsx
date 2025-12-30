import React from 'react';
import { type Control, Controller } from 'react-hook-form';

import { FormTextInput, type IRCTextInputProps } from './FormTextInput';

interface IControlledFormTextInputProps extends Omit<IRCTextInputProps, 'inputRef'> {
	control: Control<any>;
	name: string;
}

export const ControlledFormTextInput = ({ control, name, ...props }: IControlledFormTextInputProps) => (
	<Controller
		control={control}
		name={name}
		render={({ field: { onChange, value, ref } }) => (
			<FormTextInput onChangeText={onChange} value={value} inputRef={ref} {...props} />
		)}
	/>
);
