import { fireEvent, render, within } from '@testing-library/react-native';
import React from 'react';

import MessageContext from '../../../Context';
import CollapsibleQuote from '.';

const testAttachment = {
	ts: '1970-01-01T00:00:00.000Z',
	title: 'Engineering (9 today)',
	text: 'Test title',
	fields: [
		{
			title: 'Out Today:\n',
			value:
				'Ricardo Mellu, 1 day, until Fri Mar 11\nLoma, 1 day, until Fri Mar 11\nAnitta, 3 hours\nDiego Carlitos, 19 days, until Fri Mar 11\nGabriel Vasconcelos, 5 days, until Fri Mar 11\nJorge Leite, 1 day, until Fri Mar 11\nKevin Aleman, 1 day, until Fri Mar 11\nPierre, 1 day, until Fri Mar 11\nTiago Evangelista Pinto, 1 day, until Fri Mar 11'
		}
	],
	attachments: [],
	collapsed: true
};

const mockFn = jest.fn();

const Render = () => (
	<MessageContext.Provider
		value={{
			onLongPress: () => {},
			user: { username: 'Marcos' }
		}}>
		<CollapsibleQuote key={0} index={0} attachment={testAttachment} getCustomEmoji={mockFn} timeFormat='LT' />
	</MessageContext.Provider>
);

const touchableTestID = `collapsibleQuoteTouchable-${testAttachment.title}`;

describe('CollapsibleQuote', () => {
	test('rendered', async () => {
		const { findByTestId } = render(<Render />);
		const collapsibleQuoteTouchable = await findByTestId(touchableTestID);
		expect(collapsibleQuoteTouchable).toBeTruthy();
	});

	test('title exists and is correct', async () => {
		const { findByText } = render(<Render />);
		const collapsibleQuoteTitle = await findByText(testAttachment.title);
		expect(collapsibleQuoteTitle).toBeTruthy();
		expect(collapsibleQuoteTitle.props.children).toEqual(testAttachment.title);
	});

	test('text exists and is correct', async () => {
		const collapsibleQuote = render(<Render />);
		const collapsibleQuoteTouchable = await collapsibleQuote.findByTestId(touchableTestID);
		// open
		fireEvent.press(collapsibleQuoteTouchable);
		const open = within(collapsibleQuoteTouchable);
		const textOpen = open.getByLabelText(testAttachment.text);
		expect(textOpen).toBeTruthy();
		// close
		fireEvent.press(collapsibleQuoteTouchable);
		collapsibleQuote.rerender(<Render />);
		const close = within(collapsibleQuoteTouchable);
		const textClosed = close.queryByText(testAttachment.text);
		expect(textClosed).toBeNull();
	});

	test('fields render title correctly', async () => {
		const collapsibleQuote = render(<Render />);
		const collapsibleQuoteTouchable = await collapsibleQuote.findByTestId(touchableTestID);
		// open
		fireEvent.press(collapsibleQuoteTouchable);
		const open = within(collapsibleQuoteTouchable);
		const fieldTitleOpen = open.getByTestId('collapsibleQuoteTouchableFieldTitle');
		expect(fieldTitleOpen).toBeTruthy();
		expect(fieldTitleOpen.props.children).toEqual(testAttachment.fields[0].title);
		// close
		fireEvent.press(collapsibleQuoteTouchable);
		collapsibleQuote.rerender(<Render />);
		const close = within(collapsibleQuoteTouchable);
		const fieldTitleClosed = close.queryByTestId('collapsibleQuoteTouchableFieldTitle');
		expect(fieldTitleClosed).toBeNull();
	});

	test('fields render fields correctly', async () => {
		const collapsibleQuote = render(<Render />);
		const collapsibleQuoteTouchable = await collapsibleQuote.findByTestId(touchableTestID);
		// open
		fireEvent.press(collapsibleQuoteTouchable);
		const open = within(collapsibleQuoteTouchable);
		const fieldValueOpen = open.getByLabelText(testAttachment.fields[0].value.split('\n')[0]);
		expect(fieldValueOpen).toBeTruthy();
		// close
		fireEvent.press(collapsibleQuoteTouchable);
		collapsibleQuote.rerender(<Render />);
		const close = within(collapsibleQuoteTouchable);
		const fieldValueClosed = close.queryByTestId(testAttachment.fields[0].value.split('\n')[0]);
		expect(fieldValueClosed).toBeNull();
	});
});
