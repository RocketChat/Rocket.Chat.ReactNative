import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';

import Markdown, { IMarkdownProps, markdownTestID } from './index';
import { IEmoji, TGetCustomEmoji } from '../../definitions';

const getCustomEmoji: TGetCustomEmoji = content =>
	({
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content] as IEmoji);

const Render = ({ msg, baseUrl, getCustomEmoji, mentions, username }: IMarkdownProps) => {
	const reducers = combineReducers({
		app: () => ({ isMasterDetail: false })
	});
	const store = createStore(reducers);
	return (
		<Provider store={store}>
			<Markdown msg={msg} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} mentions={mentions} username={username} />
		</Provider>
	);
};

describe('Markdown', () => {
	test('should render header', () => {
		const header1 = render(<Render msg='# Header 1' />);
		const header2 = render(<Render msg='## Header 2' />);
		const header3 = render(<Render msg='### Header 3' />);
		const header4 = render(<Render msg='#### Header 4' />);
		const header5 = render(<Render msg='##### Header 5' />);
		const header6 = render(<Render msg='###### Header 6' />);

		expect(header1.findByTestId(`${markdownTestID}-header`)).toBeTruthy();
		expect(header2.findByTestId(`${markdownTestID}-header`)).toBeTruthy();
		expect(header3.findByTestId(`${markdownTestID}-header`)).toBeTruthy();
		expect(header4.findByTestId(`${markdownTestID}-header`)).toBeTruthy();
		expect(header5.findByTestId(`${markdownTestID}-header`)).toBeTruthy();
		expect(header6.findByTestId(`${markdownTestID}-header`)).toBeTruthy();
	});

	test('should render code in line', async () => {
		const { findByTestId } = render(<Render msg='This is `inline code`' />);
		const component = await findByTestId(`${markdownTestID}-code-in-line`);
		expect(component).toBeTruthy();
	});

	test('should render code block', async () => {
		const { findByTestId } = render(
			<Render
				msg='
```
Code block
```'
			/>
		);
		const component = await findByTestId(`${markdownTestID}-code-block`);
		expect(component).toBeTruthy();
	});

	test('should render image', async () => {
		const { findByTestId } = render(<Render msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' />);
		const component = await findByTestId(`${markdownTestID}-image`);
		expect(component).toBeTruthy();
	});

	test('should render link', () => {
		const markdownLink = render(<Render msg='[Markdown link](https://rocket.chat): `[description](url)`' />);
		const link = render(<Render msg='<https://rocket.chat|Formatted Link>: `<url|description>`' />);
		expect(markdownLink.findByTestId(`${markdownTestID}-link`)).toBeTruthy();
		expect(link.findByTestId(`${markdownTestID}-link`)).toBeTruthy();
	});

	test('should render block quote', async () => {
		const { findByTestId } = render(
			<Render
				msg={`> This is block quote
this is a normal line`}
			/>
		);
		const component = await findByTestId(`${markdownTestID}-block-quote`);
		expect(component).toBeTruthy();
	});

	test('should render list', () => {
		const markdownList = render(<Render msg={'* Open Source\n* Rocket.Chat\n  - nodejs\n  - ReactNative'} />);
		const markdownNumberList = render(<Render msg={'1. Open Source\n2. Rocket.Chat'} />);
		expect(markdownList.findByTestId(`${markdownTestID}-list`)).toBeTruthy();
		expect(markdownNumberList.findByTestId(`${markdownTestID}-list`)).toBeTruthy();
	});

	test('should render emojis', () => {
		const markdownCustomEmoji = render(
			<Render msg='😃 :+1: :marioparty:' getCustomEmoji={getCustomEmoji} baseUrl='https://open.rocket.chat' />
		);

		const markdownUnicodeEmoji = render(<Render msg='Unicode: 😃😇👍' />);

		expect(markdownCustomEmoji.findByTestId(`${markdownTestID}-custom-emoji`)).toBeTruthy();
		expect(markdownUnicodeEmoji.findByTestId(`${markdownTestID}-unicode-emoji`)).toBeTruthy();
	});

	test('should render hashtags', () => {
		const markdownHashtagChannels = render(<Render msg='#test-channel' channels={[{ _id: '123', name: 'test-channel' }]} />);
		const markdownHashtagWithoutChannels = render(<Render msg='#unknown' />);
		expect(markdownHashtagChannels.findByTestId(`${markdownTestID}-hashtag-channels`)).toBeTruthy();
		expect(markdownHashtagWithoutChannels.findByTestId(`${markdownTestID}-hashtag-without-channels`)).toBeTruthy();
	});

	test('should render mentions', async () => {
		const markdownMentionsAllAndHere = render(<Render msg='@all @here' username='rocket.cat' />);
		const markdownMentionsUnknown = render(<Render msg='@unknown' username='rocket.cat' />);
		const markdownMentionsUsers = render(
			<Render
				msg='@rocket.cat '
				mentions={[{ _id: 'random', name: 'Rocket Cat', username: 'rocket.cat' }]}
				username='rocket.cat'
			/>
		);
		expect(await markdownMentionsAllAndHere.findAllByTestId(`${markdownTestID}-mention-all-here`)).toBeTruthy();
		expect(await markdownMentionsUnknown.findByTestId(`${markdownTestID}-mention-unknown`)).toBeTruthy();
		expect(await markdownMentionsUsers.findByTestId(`${markdownTestID}-mention-users`)).toBeTruthy();
	});

	test('should render table', async () => {
		const { findByTestId } = render(
			<Render
				msg='First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column'
			/>
		);
		const component = await findByTestId(`${markdownTestID}-table`);
		expect(component).toBeTruthy();
	});
});
