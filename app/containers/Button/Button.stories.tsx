import React from 'react';

import Button from '.';

const buttonProps = {
	title: 'Press me!',
	type: 'primary' as const,
	onPress: () => {},
	testID: 'testButton'
};

export default {
	title: 'Button'
};

export const PrimaryButton = () => <Button {...buttonProps} />;

export const SecondaryButton = () => <Button {...buttonProps} type='secondary' />;

export const LoadingButton = () => <Button loading {...buttonProps} />;

export const DisabledButton = () => <Button disabled {...buttonProps} />;

export const DisabledLoadingButton = () => <Button disabled loading {...buttonProps} />;

export const SmallButton = () => <Button small {...buttonProps} />;

export const CustomButton = () => (
	<Button
		{...buttonProps}
		fontSize={18}
		backgroundColor='purple'
		color='yellow'
		style={{
			padding: 10
		}}
		styleText={[
			{
				textAlign: 'left'
			}
		]}
	/>
);
