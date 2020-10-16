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

stories.add('title', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem title='threads' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem title='threads' />
				</HeaderButtonContainer>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem title='threads' />
					<HeaderButtonItem title='search' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem title='threads' />
					<HeaderButtonItem title='search' />
				</HeaderButtonContainer>
			)}
		/>
	</>
));

stories.add('icons', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem iconName='threads' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem iconName='threads' />
				</HeaderButtonContainer>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem iconName='threads' />
					<HeaderButtonItem iconName='search' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem iconName='threads' />
					<HeaderButtonItem iconName='search' />
				</HeaderButtonContainer>
			)}
		/>
	</>
));

stories.add('badge', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButtonContainer left>
					<HeaderButtonItem iconName='threads' badgeText='9' badgeColor='red' />
					<HeaderButtonItem iconName='threads' badgeText='99' badgeColor='red' />
					<HeaderButtonItem iconName='threads' badgeText='999' badgeColor='red' />
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
					<HeaderButtonItem iconName='threads' />
				</HeaderButtonContainer>
			)}
			right={() => (
				<HeaderButtonContainer>
					<HeaderButtonItem title='Threads' />
					<HeaderButtonItem iconName='threads' badgeText='9' badgeColor='red' />
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
