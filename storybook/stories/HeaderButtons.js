/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { View } from 'react-native';

import { HeaderButtonContainer, HeaderButtonItem } from '../../app/containers/HeaderButton';
import Header from '../../app/containers/Header';
import { ThemeContext } from '../../app/theme';

const stories = storiesOf('Header Buttons', module);

const HeaderExample = ({ left, right }) => (
	<Header
		headerLeft={left}
		headerTitle={() => <View style={{ flex: 1 }} />}
		headerRight={right}
	/>
);

stories.add('left buttons', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem name='threads' />
				</HeaderButtonContainer>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem name='threads' />
					<HeaderButtonItem name='search' />
				</HeaderButtonContainer>
			)}
		/>
	</>
));

stories.add('right buttons', () => (
	<>
		<HeaderExample
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem name='threads' />
				</HeaderButtonContainer>
			)}
		/>
		<HeaderExample
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem name='threads' />
					<HeaderButtonItem name='search' />
				</HeaderButtonContainer>
			)}
		/>
	</>
));

stories.add('left and right buttons', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem name='threads' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem name='threads' />
				</HeaderButtonContainer>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem name='threads' />
					<HeaderButtonItem name='search' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem name='threads' />
					<HeaderButtonItem name='search' />
				</HeaderButtonContainer>
			)}
		/>
	</>
));

stories.add('with badge', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem name='threads' badgeText='9' badgeColor='red' />
					<HeaderButtonItem name='threads' badgeText='99' badgeColor='red' />
					<HeaderButtonItem name='threads' badgeText='999' badgeColor='red' />
				</HeaderButtonContainer>
			)}
		/>
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem name='threads' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem name='threads' />
					<HeaderButtonItem name='threads' badgeText='9' badgeColor='red' />
				</HeaderButtonContainer>
			)}
		/>
	</ThemeContext.Provider>
);

stories.add('themes', () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
));
