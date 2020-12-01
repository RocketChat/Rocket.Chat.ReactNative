/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { View } from 'react-native';

import * as HeaderButton from '../../app/containers/HeaderButton';
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
				<HeaderButton.Container left>
					<HeaderButton.Item title='threads' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item title='threads' />
				</HeaderButton.Container>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item title='threads' />
					<HeaderButton.Item title='search' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item title='threads' />
					<HeaderButton.Item title='search' />
				</HeaderButton.Container>
			)}
		/>
	</>
));

stories.add('icons', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='threads' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='threads' />
				</HeaderButton.Container>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='threads' />
					<HeaderButton.Item iconName='search' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='threads' />
					<HeaderButton.Item iconName='search' />
				</HeaderButton.Container>
			)}
		/>
	</>
));

stories.add('badge', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.Badge tunread={[1]} />} />
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.Badge tunread={[1]} tunreadUser={[1]} />} />
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.Badge tunread={[1]} tunreadGroup={[1]} />} />
				</HeaderButton.Container>
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
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='threads' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item title='Threads' />
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.Badge tunread={[1]} />} />
				</HeaderButton.Container>
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

stories.add('common', () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButton.Drawer />
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButton.CloseModal />
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButton.CancelModal />
			)}
		/>
		<HeaderExample
			right={() => (
				<HeaderButton.More />
			)}
		/>
		<HeaderExample
			right={() => (
				<HeaderButton.Download />
			)}
		/>
		<HeaderExample
			right={() => (
				<HeaderButton.Preferences />
			)}
		/>
		<HeaderExample
			right={() => (
				<HeaderButton.Legal />
			)}
		/>
	</>
));
