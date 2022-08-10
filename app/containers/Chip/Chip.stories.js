import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import { store } from '../../../storybook/stories';
import { ThemeContext } from '../../theme';
import { colors } from '../../lib/constants';
import Chip from './index';

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

stories.add('Short and Long Chip', () => (
	<>
		<View style={styles.container}>
			<Chip avatar='rocket.cat' text={'Rocket.Cat'} />
			<Chip avatar='rocket.cat' text={'Short'} />
			<Chip text='Without Avatar' />
			<Chip avatar='rocket.cat' text='Without Icon' />
			<Chip text='Without Avatar and Icon' />
		</View>
	</>
));
