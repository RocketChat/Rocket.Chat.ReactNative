import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import { ActionSheetProvider, useActionSheet, type IActionSheetProvider } from '..';

let mockDismissSheet: () => void;

jest.mock('@lodev09/react-native-true-sheet', () => {
	const { Component } = require('react');
	const { View } = require('react-native');
	class TrueSheet extends Component<
		{ children: React.ReactNode; onDidDismiss: () => void },
		{ shouldRenderNativeView: boolean }
	> {
		state = { shouldRenderNativeView: false };

		componentDidMount() {
			mockDismissSheet = () => {
				this.setState({ shouldRenderNativeView: false });
				this.props.onDidDismiss();
			};
		}

		present() {
			if (!this.state.shouldRenderNativeView) {
				this.setState({ shouldRenderNativeView: true });
			}
			return Promise.resolve();
		}

		dismiss() {
			return Promise.resolve();
		}

		render() {
			return this.state.shouldRenderNativeView ? <View>{this.props.children}</View> : null;
		}
	}
	return { __esModule: true, TrueSheet };
});

let actionSheet: IActionSheetProvider;
const CaptureActionSheet = () => {
	actionSheet = useActionSheet();
	return null;
};

describe('ActionSheet', () => {
	it('shows a sheet opened from the previous sheet onClose', () => {
		render(
			<ActionSheetProvider>
				<CaptureActionSheet />
			</ActionSheetProvider>
		);
		act(() =>
			actionSheet.showActionSheet({
				children: <Text>first sheet</Text>,
				onClose: () => actionSheet.showActionSheet({ children: <Text>second sheet</Text> })
			})
		);
		expect(screen.getByText('first sheet')).toBeOnTheScreen();

		act(() => mockDismissSheet());

		expect(screen.getByText('second sheet')).toBeOnTheScreen();
	});
});
