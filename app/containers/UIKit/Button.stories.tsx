import UIKitButton from './Button';

const buttonProps = {
	title: 'Press me!',
	type: 'primary' as const,
	onPress: () => {}
};

export default {
	title: 'UIKit/Button',
	component: UIKitButton
};

export const PrimaryButton = () => <UIKitButton {...buttonProps} />;

export const SecondaryButton = () => <UIKitButton {...buttonProps} type='secondary' />;

export const LoadingButton = () => <UIKitButton loading {...buttonProps} />;

export const CustomStyleButton = () => <UIKitButton {...buttonProps} style={{ marginTop: 16 }} />;
