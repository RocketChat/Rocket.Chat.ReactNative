import React from 'react';
import { FlatList } from 'react-native';

import * as List from '.';
import SafeAreaView from '../SafeAreaView';
import { longText } from '../../../.storybook/utils';
import { ThemeContext, TSupportedThemes } from '../../theme';
import { DimensionsContext } from '../../dimensions';
import { themes } from '../../lib/constants';

export default {
	title: 'List'
};

export const TitleAndSubtitle = () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Chats' />
		<List.Separator />
		<List.Item title='Chats' subtitle='All' />
		<List.Separator />
		<List.Item title={longText} subtitle={longText} translateTitle={false} translateSubtitle={false} testID='test-id' />
		<List.Separator />
	</List.Container>
);

export const Alert = () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Chats' alert />
		<List.Separator />
		<List.Item title={longText} translateTitle={false} translateSubtitle={false} alert />
		<List.Separator />
		<List.Item title='Chats' right={() => <List.Icon name='emoji' />} alert />
		<List.Separator />
		<List.Item title={longText} translateTitle={false} translateSubtitle={false} right={() => <List.Icon name='emoji' />} alert />
		<List.Separator />
	</List.Container>
);

export const Pressable = () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Press me' onPress={() => alert('Hi there!')} translateTitle={false} />
		<List.Separator />
		<List.Item title={"I'm disabled"} onPress={() => alert('Hi there!')} disabled translateTitle={false} />
		<List.Separator />
	</List.Container>
);

export const Header = () => (
	<List.Container>
		<List.Header title='Chats' />
		<List.Header title={longText} translateTitle={false} />
	</List.Container>
);

export const Icon = () => (
	<List.Container>
		<List.Icon name='emoji' />
	</List.Container>
);

export const Separator = () => (
	<List.Container>
		<List.Separator />
	</List.Container>
);

export const SectionAndInfo = () => (
	<SafeAreaView>
		<List.Container>
			<List.Section>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
			</List.Section>
			<List.Section>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
			</List.Section>
			<List.Section title='Chats'>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Info info='Chats' />
			</List.Section>
			<List.Section title={longText} translateTitle={false}>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Info info={longText} translateInfo={false} />
			</List.Section>
		</List.Container>
	</SafeAreaView>
);

export const WithIcon = () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Icon Left' translateTitle={false} left={() => <List.Icon name='emoji' />} />
		<List.Separator />
		<List.Item title='Icon Right' translateTitle={false} right={() => <List.Icon name='emoji' />} />
		<List.Separator />
		<List.Item
			title={longText}
			subtitle={longText}
			translateTitle={false}
			translateSubtitle={false}
			left={() => <List.Icon name='emoji' />}
			right={() => <List.Icon name='emoji' />}
		/>
		<List.Separator />
		<List.Item title='Show Action Indicator' translateTitle={false} showActionIndicator />
		<List.Separator />
	</List.Container>
);

export const WithCustomColors = () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Chats' color='red' />
		<List.Separator />
		<List.Item
			title='Press me!'
			color='white'
			onPress={() => alert('Press')}
			backgroundColor='red'
			underlayColor='green'
			translateTitle={false}
		/>
		<List.Separator />
	</List.Container>
);

const ListItemFull = ({ ...props }) => (
	<List.Item
		title='Chats'
		subtitle='All'
		onPress={() => alert('Hi')}
		left={() => <List.Icon name='emoji' />}
		right={() => <List.Icon name='emoji' />}
		{...props}
	/>
);

const ListFull = () => (
	<SafeAreaView>
		<List.Container>
			<List.Section title='Chats'>
				<List.Separator />
				<ListItemFull />
				<List.Separator />
				<ListItemFull disabled />
				<List.Separator />
				<List.Info info='Chats' />
			</List.Section>
			<List.Section title='Chats'>
				<List.Separator />
				<ListItemFull />
				<List.Separator />
				<ListItemFull disabled />
				<List.Separator />
				<List.Info info='Chats' />
			</List.Section>
		</List.Container>
	</SafeAreaView>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<ListFull />
	</ThemeContext.Provider>
);

export const WithDarkTheme = () => <ThemeStory theme='dark' />;

export const WithBlackTheme = () => <ThemeStory theme='black' />;

const FontStory = ({ fontScale }: { fontScale: number }) => (
	// @ts-ignore
	<DimensionsContext.Provider value={{ fontScale }}>
		<ListFull />
	</DimensionsContext.Provider>
);

/**
 * It's going to test height only.
 * Font scale on text and icons is applied based on OS setting
 */
export const WithSmallFont = () => <FontStory fontScale={0.8} />;

export const WithBiggerFont = () => <FontStory fontScale={1.5} />;

export const WithFlatList = () => (
	<SafeAreaView>
		<FlatList
			data={[...Array(30).keys()]}
			contentContainerStyle={List.styles.contentContainerStyleFlatList}
			renderItem={({ item }) => <List.Item title={item.toString()} translateTitle={false} />}
			ListHeaderComponent={List.Separator}
			ListFooterComponent={List.Separator}
			ItemSeparatorComponent={List.Separator}
		/>
	</SafeAreaView>
);
