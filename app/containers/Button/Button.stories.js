import React from 'react';
import { storiesOf } from '@storybook/react-native';

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

const stories = storiesOf('Button', module);

stories.add('primary button', () => <Button {...buttonProps} />);

stories.add('secondary button', () => <Button {...buttonProps} type='secondary' />);

stories.add('loading button', () => <Button loading {...buttonProps} />);

stories.add('disabled button', () => <Button disabled {...buttonProps} />);

stories.add('disabled loading button', () => <Button disabled loading {...buttonProps} />);
