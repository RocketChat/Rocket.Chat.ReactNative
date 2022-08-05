import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import EventEmitter from '../../lib/methods/helpers/events';
import Loading, { LOADING_BUTTON_TEST_ID, LOADING_EVENT, LOADING_IMAGE_TEST_ID, LOADING_TEST_ID } from '.';

const Render = () => <Loading />;

describe('Loading', () => {
	it('starts hidden and shows/hides when event is received', async () => {
		const { getByTestId } = render(<Render />);
		const loading = getByTestId(LOADING_TEST_ID);
		expect(loading).toBeTruthy();
		expect(loading.props.visible).toBe(false);
		act(() => EventEmitter.emit(LOADING_EVENT, { visible: true }));
		await waitFor(() => {
			expect(loading.props.visible).toBe(true);
		});
		const image = getByTestId(LOADING_IMAGE_TEST_ID);
		expect(image).toBeTruthy();
		act(() => EventEmitter.emit(LOADING_EVENT, { visible: false }));
		await waitFor(() => {
			expect(loading.props.visible).toBe(false);
		});
	});

	it('doesnt have onCancel and doesnt hide when pressed', async () => {
		const { getByTestId } = render(<Render />);
		const loading = getByTestId(LOADING_TEST_ID);
		expect(loading).toBeTruthy();
		expect(loading.props.visible).toBe(false);
		act(() => EventEmitter.emit(LOADING_EVENT, { visible: true }));
		await waitFor(() => {
			expect(loading.props.visible).toBe(true);
		});
		fireEvent.press(getByTestId(LOADING_BUTTON_TEST_ID));
		await waitFor(() => {
			expect(loading.props.visible).toBe(true);
		});
	});

	it('has onCancel and hides when pressed', async () => {
		const mockFn = jest.fn();
		const { getByTestId } = render(<Render />);
		const loading = getByTestId(LOADING_TEST_ID);
		expect(loading).toBeTruthy();
		expect(loading.props.visible).toBe(false);
		act(() => EventEmitter.emit(LOADING_EVENT, { visible: true, onCancel: mockFn }));
		await waitFor(() => {
			expect(loading.props.visible).toBe(true);
		});
		fireEvent.press(getByTestId(LOADING_BUTTON_TEST_ID));
		await waitFor(() => {
			expect(loading.props.visible).toBe(false);
		});
		expect(mockFn).toHaveBeenCalled();
	});

	it('asserts onCancel return', async () => {
		const mockFn = jest.fn();
		const mockFn2 = jest.fn(() => 'test');
		const { getByTestId } = render(<Render />);
		const loading = getByTestId(LOADING_TEST_ID);
		expect(loading).toBeTruthy();
		expect(loading.props.visible).toBe(false);
		act(() => EventEmitter.emit(LOADING_EVENT, { visible: true, onCancel: mockFn }));
		await waitFor(() => {
			expect(loading.props.visible).toBe(true);
		});
		act(() => EventEmitter.emit(LOADING_EVENT, { visible: true, onCancel: mockFn2 }));
		await waitFor(() => {
			expect(loading.props.visible).toBe(true);
		});
		fireEvent.press(getByTestId(LOADING_BUTTON_TEST_ID));
		await waitFor(() => {
			expect(loading.props.visible).toBe(false);
		});
		expect(mockFn).not.toHaveBeenCalled();
		expect(mockFn2).toHaveBeenCalled();
	});
});
