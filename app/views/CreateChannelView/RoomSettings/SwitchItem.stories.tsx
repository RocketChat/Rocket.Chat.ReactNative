import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import { mockedStore as store } from '../../../reducers/mockedStore';
import { ThemeContext } from '../../../theme';
import { colors } from '../../../lib/constants';
import { SwitchItem } from './SwitchItem';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'flex-start',
		padding: 16
	}
});

const theme = 'light';

const stories = storiesOf('Chip', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.addDecorator(story => <ThemeContext.Provider value={{ theme, colors: colors[theme] }}>{story()}</ThemeContext.Provider>);

const testSwitch = {
	id: 'switch-id',
	hint: 'Read_only_hint',
	label: 'Onboarding_title',
	onValueChange: () => {},
	value: false,
	testSwitchID: 'create-channel-switch-id',
	testLabelID: 'create-channel-switch-id-hint'
};

stories.add('Switch with label and hint', () => (
	<>
		<View style={styles.container}>
			<SwitchItem
				hint={testSwitch.hint}
				id={testSwitch.id}
				label={testSwitch.label}
				onValueChange={() => testSwitch.onValueChange()}
				value={testSwitch.value}
			/>
		</View>
	</>
));
