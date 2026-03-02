
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import Markdown from '.';
import { themes } from '../../lib/constants/colors';

const theme = 'light';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
		backgroundColor: themes[theme].surfaceRoom,
		marginVertical: 50
	}
});

export default {
	title: 'Markdown/Highlights',
	decorators: [
		(Story: any) => (
			<NavigationContainer>
				<Story />
			</NavigationContainer>
		)
	]
};

export const Highlights = () => (
	<View style={styles.container}>
		<Markdown highlights={['rocket', 'Lorem', 'mixed']} msg={'This is Rocket.Chat — highlight the word rocket (case-insensitive).'} />
		<Markdown highlights={['rocket', 'Lorem', 'mixed']} msg={'Lorem ipsum dolor sit amet, this should highlight Lorem and mixed-case Mixed.'} />
		<Markdown highlights={['rocket', 'Lorem', 'mixed']} msg={'Edge cases: rockets, rocketing (only exact words defined will match).'} />
	</View>
);

