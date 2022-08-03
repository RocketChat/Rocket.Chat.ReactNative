import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import { store } from '../../../storybook/stories';
import { ThemeContext } from '../../theme';
import { colors } from '../../lib/constants';
import Chip from './index';

const styles = StyleSheet.create({
	paddingHorizontal: {
		paddingHorizontal: 14
	}
});

const theme = 'light';

const stories = storiesOf('Chip', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.addDecorator(story => <ThemeContext.Provider value={{ theme, colors: colors[theme] }}>{story()}</ThemeContext.Provider>);

stories.add('Short and Long Chip', () => (
	<>
		<View style={styles.paddingHorizontal}>
			<Chip iconName='close' avatar='rocket.cat' text={'Rocket.Cat'} />
			<Chip iconName='close' avatar='rocket.cat' />
		</View>
	</>
));
