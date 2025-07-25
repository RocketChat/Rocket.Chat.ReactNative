import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import Loading, { sendLoadingEvent, LOADING_BUTTON_TEST_ID, LOADING_IMAGE_TEST_ID, LOADING_TEST_ID } from '.';

const Render = () => <Loading />;

const getByTestIdAndThrow = (fn: Function, testID: string) =>
	expect(() => fn(testID)).toThrow(`Unable to find an element with testID: ${testID}`);

describe('Loading', () => {
	it('starts invisible and shows/hides when event is received', async () => {
		const { getByTestId } = render(<Render />);
		getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		// receive event and expect loading to be rendered
		act(() => sendLoadingEvent({ visible: true }));
		await waitFor(() => {
			expect(() => getByTestId(LOADING_TEST_ID)).toBeTruthy();
		});
		expect(() => getByTestId(LOADING_IMAGE_TEST_ID)).toBeTruthy();
		// receive event and expect loading not to be rendered
		act(() => sendLoadingEvent({ visible: false }));
		await waitFor(() => {
			getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		});
	});

	it('doesnt have onCancel and doesnt hide when pressed', async () => {
		const { getByTestId } = render(<Render />);
		getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		act(() => sendLoadingEvent({ visible: true }));
		expect(() => getByTestId(LOADING_TEST_ID)).toBeTruthy();
		fireEvent.press(getByTestId(LOADING_BUTTON_TEST_ID));
		await waitFor(() => {
			expect(() => getByTestId(LOADING_TEST_ID)).toBeTruthy();
		});
	});

	it('has onCancel and hides when pressed', async () => {
		const mockFn = jest.fn();
		const { getByTestId } = render(<Render />);
		getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		act(() => sendLoadingEvent({ visible: true, onCancel: mockFn }));
		await waitFor(() => {
			expect(() => getByTestId(LOADING_TEST_ID)).toBeTruthy();
		});
		fireEvent.press(getByTestId(LOADING_BUTTON_TEST_ID));
		await waitFor(() => {
			getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		});
		expect(mockFn).toHaveBeenCalled();
	});

	it('asserts onCancel return', async () => {
		const mockFn = jest.fn();
		const mockFn2 = jest.fn(() => 'test');
		const { getByTestId } = render(<Render />);
		getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		act(() => sendLoadingEvent({ visible: true, onCancel: mockFn }));
		await waitFor(() => {
			expect(() => getByTestId(LOADING_TEST_ID)).toBeTruthy();
		});
		act(() => sendLoadingEvent({ visible: true, onCancel: mockFn2 }));
		await waitFor(() => {
			expect(() => getByTestId(LOADING_TEST_ID)).toBeTruthy();
		});
		fireEvent.press(getByTestId(LOADING_BUTTON_TEST_ID));
		await waitFor(() => {
			getByTestIdAndThrow(getByTestId, LOADING_TEST_ID);
		});
		expect(mockFn).not.toHaveBeenCalled();
		expect(mockFn2).toHaveBeenCalled();
	});
});
