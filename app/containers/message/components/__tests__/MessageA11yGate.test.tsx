import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { type TAnyMessageModel } from '../../../../definitions';
import { A11yGateContext } from '../../stores/A11yGate';
import { type MessageRoomState } from '../../stores/MessageRoomStore';
import MessageTouchable from '../Touchable/MessageTouchable';
import MessageAccessibleIndex from '../MessageAccessibleIndex';
import { MessageProviders } from '../../__tests__/testHelpers';

// Render the react-native-a11y-order Fabric views as plain testID-bearing Views so the gating
// seam is observable from the tree. This is the only thing mocked; the gate value is driven purely
// through A11yGateContext, never by mocking useIsAccessibilityNavigationEnabled.
jest.mock('react-native-a11y-order', () => {
	const { View: RNView } = require('react-native');
	return {
		A11y: {
			Order: ({ children, ...props }: any) => (
				<RNView testID='a11y-order' {...props}>
					{children}
				</RNView>
			),
			Index: ({ children, index, ...props }: any) => (
				<RNView testID={`a11y-index-${index}`} {...props}>
					{children}
				</RNView>
			)
		}
	};
});

// Touch pulls in gesture-handler internals irrelevant to the a11y seam; render a plain wrapper instead.
jest.mock('../Touchable/Touch', () => {
	const { forwardRef } = require('react');
	const { View: RNView } = require('react-native');
	return forwardRef(({ children, ...props }: any, ref: any) => (
		<RNView ref={ref} {...props}>
			{children}
		</RNView>
	));
});

const createMockMessage = (overrides: Record<string, any> = {}): TAnyMessageModel =>
	({
		id: 'msg-1',
		msg: 'Hello World',
		t: undefined,
		ts: new Date(),
		u: { _id: 'user-1', username: 'testuser', name: 'Test User' },
		groupable: true,
		experimentalSubscribe: jest.fn(() => jest.fn()),
		...overrides
	}) as unknown as TAnyMessageModel;

const room: Partial<MessageRoomState> = { rid: 'room-1' };

const renderTouchable = (gate: boolean, itemOverrides: Record<string, any> = {}) =>
	render(
		<A11yGateContext.Provider value={gate}>
			<MessageProviders item={createMockMessage(itemOverrides)} room={room}>
				<MessageTouchable />
			</MessageProviders>
		</A11yGateContext.Provider>
	);

describe('per-row a11y wrapper gating', () => {
	describe('MessageTouchable — normal message', () => {
		it('gate false: no A11y.Order / A11y.Index, message still renders', () => {
			const { queryByTestId } = renderTouchable(false);
			expect(queryByTestId('a11y-order')).toBeNull();
			expect(queryByTestId('a11y-index-1')).toBeNull();
			expect(queryByTestId('message-msg-1')).toBeTruthy();
		});

		it('gate true: wraps in A11y.Order and A11y.Index index=1', () => {
			const { getByTestId } = renderTouchable(true);
			expect(getByTestId('a11y-order')).toBeTruthy();
			expect(getByTestId('a11y-index-1')).toBeTruthy();
			expect(getByTestId('message-msg-1')).toBeTruthy();
		});
	});

	describe('MessageTouchable — info message (Order-only branch)', () => {
		it('gate false: no A11y.Order', () => {
			const { queryByTestId } = renderTouchable(false, { t: 'uj' });
			expect(queryByTestId('a11y-order')).toBeNull();
			expect(queryByTestId('a11y-index-1')).toBeNull();
		});

		it('gate true: A11y.Order present, no A11y.Index', () => {
			const { getByTestId, queryByTestId } = renderTouchable(true, { t: 'uj' });
			expect(getByTestId('a11y-order')).toBeTruthy();
			expect(queryByTestId('a11y-index-1')).toBeNull();
		});
	});

	describe('MessageAccessibleIndex — index=2', () => {
		const renderIndex = (gate: boolean, style?: object) =>
			render(
				<A11yGateContext.Provider value={gate}>
					<MessageProviders
						item={createMockMessage({ autoTranslate: true })}
						room={{ ...room, autoTranslateLanguage: 'pt-BR', autoTranslateRoom: true }}>
						<MessageAccessibleIndex style={style}>
							<Text testID='index-child'>child</Text>
						</MessageAccessibleIndex>
					</MessageProviders>
				</A11yGateContext.Provider>
			);

		it('gate false with style: plain View keeps the style, no A11y.Index', () => {
			const { queryByTestId, getByTestId, toJSON } = renderIndex(false, { flex: 1 });
			expect(queryByTestId('a11y-index-2')).toBeNull();
			expect(getByTestId('index-child')).toBeTruthy();
			expect(toJSON()).toMatchObject({ type: 'View', props: { style: { flex: 1 } } });
		});

		it('gate false unstyled: child renders directly, no wrapper', () => {
			const { queryByTestId, getByTestId } = renderIndex(false);
			expect(queryByTestId('a11y-index-2')).toBeNull();
			expect(getByTestId('index-child')).toBeTruthy();
		});

		it('gate true: A11y.Index index=2 forwards translation-aware props and style', () => {
			const { getByTestId } = renderIndex(true, { flex: 1 });
			const index = getByTestId('a11y-index-2');
			expect(index.props.accessibilityLanguage).toBe('pt-BR');
			expect(typeof index.props.accessible).toBe('boolean');
			expect('accessibilityLabel' in index.props).toBe(true);
			expect(index.props.style).toEqual({ flex: 1 });
		});
	});
});
