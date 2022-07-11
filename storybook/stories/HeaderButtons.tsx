import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { SafeAreaView } from 'react-native';
import { Header, HeaderBackground } from '@react-navigation/elements';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as HeaderButton from '../../app/containers/HeaderButton';
import { TColors, ThemeContext, TSupportedThemes } from '../../app/theme';
import { colors } from '../../app/lib/constants';

const stories = storiesOf('Header Buttons', module).addDecorator(story => <SafeAreaProvider>{story()}</SafeAreaProvider>);

interface IHeader {
	left?: () => React.ReactElement | null;
	right?: () => React.ReactElement;
	title?: string;
	colors?: TColors;
}

const HeaderExample = ({ left, right, colors, title = '' }: IHeader) => (
	<SafeAreaView>
		<Header
			title={title}
			headerLeft={left}
			headerRight={right}
			headerBackground={() => <HeaderBackground style={{ backgroundColor: colors?.headerBackground }} />}
		/>
	</SafeAreaView>
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

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
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
			colors={colors[theme]}
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
		<HeaderExample left={() => <HeaderButton.Drawer />} />
		<HeaderExample left={() => <HeaderButton.CloseModal />} />
		<HeaderExample left={() => <HeaderButton.CancelModal />} />
		<HeaderExample right={() => <HeaderButton.More />} />
		<HeaderExample right={() => <HeaderButton.Download />} />
		<HeaderExample right={() => <HeaderButton.Preferences />} />
		<HeaderExample right={() => <HeaderButton.Legal />} />
	</>
));
