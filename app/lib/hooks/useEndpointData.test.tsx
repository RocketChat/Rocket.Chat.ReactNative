/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { renderHook } from '@testing-library/react-hooks';
import { render, waitFor } from '@testing-library/react-native';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import { useEndpointData } from './useEndpointData';

const url = 'chat.getMessage';

export const message = {
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
// jest.mock('../services/sdk', () => ({
// 	get: jest.fn(() => Promise.resolve({ success: true, message }))
// }));

function delay(milliseconds) {
	return new Promise(resolve => {
		setTimeout(resolve, milliseconds);
	});
}

const useTest = () => {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchMyAPI() {
			await delay(1000);
			setLoading(false);
		}

		fetchMyAPI();
	}, []);

	return { loading };
};

function Comp() {
	const { loading } = useTest();
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

function Comp2() {
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
	it('dumb test', () => {
		expect(true).toBe(true);
	});
	// beforeEach(() => {
	// 	jest.setTimeout(10000);
	// });
	// test hook
	// it('should return data after fetch', () => {
	// Mock API
	// Execute
	// const { result, waitForNextUpdate } = renderHook(() => useEndpointData(url, { msgId: message._id }));
	// expect(result.current.loading).toEqual(true);
	// expect(result.current.result).toEqual(undefined);
	// jest.advanceTimersByTime(1000);
	// waitForNextUpdate();
	// expect(result.current.loading).toEqual(false);
	// expect(result.current.result).toEqual({ success: true, message });
	// console.log(result.current);
	// await waitForNextUpdate();
	// console.log(result.current);
	// rerender();
	// await waitFor(() => {
	// 	console.log(result.current.result);
	// expect(result.current.result).toEqual('first render');
	// });
	// });
	// Mock API
	// test render comp
	// it('should return data after fetch 1', async () => {
	// 	const { findByTestId } = render(<Comp />);
	// 	const comp = await findByTestId('loading');
	// 	expect(comp.props.children).toBe('loading');
	// });
	// it('should return data after fetch 2', () => {
	// 	const { findByTestId } = render(<Comp />);
	// 	waitFor(async () => {
	// 		const comp = await findByTestId('load complete');
	// 		expect(comp.props.children).toBe('load complete');
	// 	});
	// });
	// test mocked hook
	// it('test hook', async () => {
	// 	const { result, waitForNextUpdate } = renderHook(() => useTest());
	// 	expect(result.current.loading).toBe(true);
	// 	await waitForNextUpdate();
	// 	expect(result.current.loading).toBe(false);
	// 	console.log(result.current);
	// });
	// original
	// it('should return data after fetch 3', async () => {
	// 	const { findByTestId } = render(<Comp2 />);
	// 	const comp = await findByTestId('loading');
	// 	expect(comp.props.children).toBe('loading');
	// });
	// it('should return data after fetch', async () => {
	// 	const { findByTestId } = render(<Comp2 />);
	// 	const render1 = await findByTestId('loading');
	// 	expect(render1.props.children).toBe('loading');
	// 	const render2 = await findByTestId('load complete');
	// 	expect(render2.props.children).toBe('load complete');
	// });
});
