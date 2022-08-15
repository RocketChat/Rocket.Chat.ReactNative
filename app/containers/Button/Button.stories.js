import React from 'react';

import Button from '.';

const buttonProps = {
	title: 'Press me!',
	type: 'primary',
	onPress: () => {},
	testID: 'testButton',
	fontSize: 16,
	style: {
		padding: 10,
		justifyContent: 'center'
	}
};

export default {
	title: 'Button',
	component: Button
};

export const PrimaryButton = () => <Button {...buttonProps} />;

export const SecondaryButton = () => <Button {...buttonProps} type='secondary' />;

export const LoadingButton = () => <Button loading {...buttonProps} />;

export const DisabledButton = () => <Button disabled {...buttonProps} />;

export const DisabledLoadingButton = () => <Button disabled loading {...buttonProps} />;
