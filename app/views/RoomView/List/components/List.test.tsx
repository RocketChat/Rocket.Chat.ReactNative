import React, { createRef } from 'react';
import { render } from '@testing-library/react-native';

import List from './List';
import { RoomContext } from '../../context';
import { type TAnyMessageModel } from '../../../../definitions';

jest.mock('@shopify/flash-list', () => {
	const React = require('react');
	const { FlatList } = require('react-native');

	return {
		FlashList: React.forwardRef((props: any, ref: any) => <FlatList ref={ref} {...props} />)
	};
});

const messages = [{ id: '1' }, { id: '2' }] as TAnyMessageModel[];

const renderList = (isAutocompleteVisible: boolean) =>
	render(
		<RoomContext.Provider value={{ room: {}, selectedMessages: [], isAutocompleteVisible }}>
			<List
				listRef={createRef()}
				jumpToBottom={jest.fn()}
				data={messages}
				keyExtractor={item => item.id}
				renderItem={({ item }) => null}
			/>
		</RoomContext.Provider>
	);

describe('RoomView List accessibility', () => {
	it('hides message list from accessibility tree while autocomplete is visible', () => {
		const { UNSAFE_getByProps } = renderList(true);
		const list = UNSAFE_getByProps({ testID: 'room-view-messages' });

		expect(list.props.accessibilityElementsHidden).toBe(true);
		expect(list.props.importantForAccessibility).toBe('no-hide-descendants');
	});

	it('keeps message list visible to accessibility tree while autocomplete is hidden', () => {
		const { UNSAFE_getByProps } = renderList(false);
		const list = UNSAFE_getByProps({ testID: 'room-view-messages' });

		expect(list.props.accessibilityElementsHidden).toBe(false);
		expect(list.props.importantForAccessibility).toBe('yes');
	});
});
