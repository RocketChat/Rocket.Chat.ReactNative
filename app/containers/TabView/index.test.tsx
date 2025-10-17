import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { type Route } from 'reanimated-tab-view';
import { Text, View } from 'react-native';

import { TabView } from './index';

// Mock the reanimated-tab-view module
jest.mock('reanimated-tab-view', () => ({
	__esModule: true,
	TabView: ({
		navigationState,
		renderScene,
		renderTabBar,
		onIndexChange
	}: {
		navigationState: { routes: Route[]; index: number };
		renderScene: (props: { route: Route }) => React.ReactNode;
		renderTabBar: (props: { jumpTo: (key: string) => void; routeIndex: number }) => React.ReactNode;
		onIndexChange: (index: number) => void;
	}) => {
		const jumpTo = (key: string) => {
			const index = navigationState.routes.findIndex(route => route.key === key);
			if (index !== -1) {
				onIndexChange(index);
			}
		};

		return (
			<>
				{renderTabBar({ jumpTo, routeIndex: navigationState.index })}
				{renderScene({ route: navigationState.routes[navigationState.index] })}
			</>
		);
	}
}));

// Mock the theme hook
jest.mock('../../theme', () => ({
	useTheme: () => ({
		colors: {
			strokeHighlight: '#FF0000',
			fontSecondaryInfo: '#666666',
			strokeExtraLight: '#EEEEEE'
		}
	})
}));

describe('TabView', () => {
	const mockRoutes: Route[] = [
		{ key: 'tab1', title: 'Tab 1' },
		{ key: 'tab2', title: 'Tab 2' }
	];

	const mockRenderTabItem = (tab: Route, color: string) => (
		<Text testID={`tab-${tab.key}-text`} style={{ color }}>
			{tab.title}
		</Text>
	);

	const mockRenderScene = ({ route }: { route: Route }) => (
		<View testID={`scene-${route.key}`}>
			<Text>{route.title} Content</Text>
		</View>
	);

	it('renders all tabs correctly', () => {
		const { getByTestId, getByText } = render(
			<TabView routes={mockRoutes} renderTabItem={mockRenderTabItem} renderScene={mockRenderScene} />
		);

		// Verify both tabs are rendered by their text content
		expect(getByText('Tab 1')).toBeTruthy();
		expect(getByText('Tab 2')).toBeTruthy();

		// Verify initial scene is rendered
		expect(getByTestId('scene-tab1')).toBeTruthy();
	});

	it('changes active tab when clicked', () => {
		const { getByText, getByTestId } = render(
			<TabView routes={mockRoutes} renderTabItem={mockRenderTabItem} renderScene={mockRenderScene} />
		);

		// Initial state - tab1 should be active
		const tab1Text = getByText('Tab 1');
		const tab2Text = getByText('Tab 2');

		expect(tab1Text.props.style.color).toBe('#FF0000'); // strokeHighlight
		expect(tab2Text.props.style.color).toBe('#666666'); // fontSecondaryInfo

		// Click on second tab
		fireEvent.press(tab2Text);

		// After click - tab2 should be active and scene should change
		expect(getByTestId('scene-tab2')).toBeTruthy();
		expect(tab1Text.props.style.color).toBe('#666666'); // fontSecondaryInfo
		expect(tab2Text.props.style.color).toBe('#FF0000'); // strokeHighlight
	});

	it('maintains tab state correctly through multiple transitions', () => {
		const { getByText, getByTestId } = render(
			<TabView routes={mockRoutes} renderTabItem={mockRenderTabItem} renderScene={mockRenderScene} />
		);

		const tab1Text = getByText('Tab 1');
		const tab2Text = getByText('Tab 2');

		// Initial state check
		expect(getByTestId('scene-tab1')).toBeTruthy();
		expect(tab1Text.props.style.color).toBe('#FF0000');

		// Click sequence: tab2 -> tab1 -> tab2
		fireEvent.press(tab2Text);
		expect(getByTestId('scene-tab2')).toBeTruthy();
		expect(tab2Text.props.style.color).toBe('#FF0000');

		fireEvent.press(tab1Text);
		expect(getByTestId('scene-tab1')).toBeTruthy();
		expect(tab1Text.props.style.color).toBe('#FF0000');

		fireEvent.press(tab2Text);
		expect(getByTestId('scene-tab2')).toBeTruthy();
		expect(tab2Text.props.style.color).toBe('#FF0000');
	});
});
