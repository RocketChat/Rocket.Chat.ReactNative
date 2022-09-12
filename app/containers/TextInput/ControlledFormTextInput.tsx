import React from 'react';
import { Control, Controller } from 'react-hook-form';

import { FormTextInput, IRCTextInputProps } from './FormTextInput';

interface IControlledFormTextInputProps extends IRCTextInputProps {
	control: Control<any>;
	name: string;
}

export const ControlledFormTextInput = ({ control, name, ...props }: IControlledFormTextInputProps) => (
	<Controller
		control={control}
		name={name}
		render={({ field: { onChange, value } }) => <FormTextInput onChangeText={onChange} value={value} {...props} />}
	/>
);
