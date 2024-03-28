import { renderHook } from '@testing-library/react-hooks';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { View, Text } from 'react-native';

import { useEndpointData } from './useEndpointData';
import sdk from '../services/sdk';

const url = 'chat.getMessage';

const message = {
	_id: '9tYkmJ67wMwmvQouD',
	t: 'uj',
	rid: 'GENERAL',
	ts: '2022-07-05T19:34:30.146Z',
	msg: 'xdani',
	u: {
		_id: 'ombax8oEZnE7N3Mtt',
		username: 'xdani',
		name: 'xdani'
	},
	groupable: false,
	_updatedAt: '2022-07-05T19:34:30.146Z'
};

// mock sdk
jest.mock('../services/sdk', () => ({
	get: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: true, message }), 1000)))
}));

function Render() {
	const { loading } = useEndpointData(url, { msgId: message._id });
	if (loading) {
		return (
			<View>
				<Text testID='loading'>loading</Text>
			</View>
		);
	}
	return (
		<View>
			<Text testID='load complete'>load complete</Text>
		</View>
	);
}

describe('useFetch', () => {
	it('should return data after fetch', async () => {
		const { result, waitForNextUpdate } = renderHook(() => useEndpointData(url, { msgId: message._id }));
		expect(result.current.loading).toEqual(true);
		expect(result.current.result).toEqual(undefined);
		await waitForNextUpdate();
		expect(result.current.loading).toEqual(false);
		expect(result.current.result).toEqual({ success: true, message });
	});

	it('should component load correctly', async () => {
		const renderComponent = render(<Render />);
		const loading = await renderComponent.findByTestId('loading');
		expect(loading.props.children).toBe('loading');
		await waitFor(
			() => {
				expect(renderComponent.getByText('load complete')).toBeTruthy();
			},
			{ timeout: 2000 }
		);
	});

	it('should return error after fetch', async () => {
		const spy = jest
			.spyOn(sdk, 'get')
			.mockImplementation(
				jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: false, error: null }), 1000)))
			);

		const { result, waitForNextUpdate } = renderHook(() => useEndpointData(url, { msgId: message._id }));
		expect(result.current.loading).toEqual(true);
		expect(result.current.result).toEqual(undefined);
		expect(result.current.error).toEqual(undefined);
		await waitForNextUpdate();
		expect(result.current.loading).toEqual(false);
		expect(result.current.result).toEqual(undefined);
		expect(result.current.error).toEqual({ success: false, error: null });

		spy.mockRestore();
	});
});
