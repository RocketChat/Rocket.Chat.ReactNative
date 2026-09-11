import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import { setUser } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import { mockedStore } from '../../reducers/mockedStore';
import openLink from '../../lib/methods/helpers/openLink';
import { setServerCookies } from '../../lib/methods/helpers/setServerCookies';
import ConferenceWebView from './ConferenceWebView';

const SERVER = 'https://open.rocket.chat';
const CONFERENCE_URL = `${SERVER}/conference/call1`;

/** Props of the last WebView render, so the handlers under test can be invoked directly. */
let mockWebViewProps: Record<string, any> = {};
/** Mount count, to tell a re-render apart from the WebView being destroyed and recreated. */
let mockWebViewMounts = 0;

jest.mock('react-native-webview', () => {
	const { forwardRef, useEffect } = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');

	const MockWebView = forwardRef((props: Record<string, any>, ref: unknown) => {
		useEffect(() => {
			mockWebViewMounts += 1;
		}, []);
		useEffect(() => {
			mockWebViewProps = props;
		});
		return <View ref={ref} testID='conference-webview' />;
	});

	return { __esModule: true, default: MockWebView };
});

jest.mock('expo-keep-awake', () => ({ activateKeepAwake: jest.fn(), deactivateKeepAwake: jest.fn() }));
jest.mock('../../lib/methods/helpers/openLink', () => jest.fn());
jest.mock('../../lib/methods/helpers/setServerCookies', () => ({ setServerCookies: jest.fn(() => Promise.resolve()) }));

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const mount = (url = CONFERENCE_URL) =>
	render(
		<Wrapper>
			<ConferenceWebView url={url} expanded onClose={jest.fn()} onOpenLink={jest.fn()} />
		</Wrapper>
	);

/** Lets effects and their promises settle inside act, so the tree is stable to assert on. */
const settle = () =>
	act(async () => {
		await Promise.resolve();
	});

// The WebView only mounts once the credential cookies have been written.
const mountAndSettle = async (url = CONFERENCE_URL) => {
	const utils = mount(url);
	await settle();
	return utils;
};

describe('ConferenceWebView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockWebViewProps = {};
		mockWebViewMounts = 0;
		mockedStore.dispatch(selectServerRequest(SERVER, '8.0.0'));
		mockedStore.dispatch(setUser({ id: 'uid1', token: 'tok1' }));
	});

	describe('navigation guard', () => {
		test('keeps a conference navigation inside the webview', async () => {
			await mountAndSettle();

			const allowed = mockWebViewProps.onShouldStartLoadWithRequest({ url: `${SERVER}/conference/call2`, isTopFrame: true });

			expect(allowed).toBe(true);
			expect(openLink).not.toHaveBeenCalled();
		});

		test('sends an off-origin navigation to the browser instead', async () => {
			await mountAndSettle();

			const allowed = mockWebViewProps.onShouldStartLoadWithRequest({ url: 'https://evil.example.com/', isTopFrame: true });

			expect(allowed).toBe(false);
			expect(openLink).toHaveBeenCalledWith('https://evil.example.com/', expect.anything());
		});

		test('sends an off-origin navigation to the browser when the platform omits isTopFrame', async () => {
			// Android's synchronous shouldOverrideUrlLoading path builds the event without isTopFrame.
			// Treating that as a subframe would let any origin load with the bridge and cookies attached.
			await mountAndSettle();

			const allowed = mockWebViewProps.onShouldStartLoadWithRequest({ url: 'https://evil.example.com/' });

			expect(allowed).toBe(false);
			expect(openLink).toHaveBeenCalledWith('https://evil.example.com/', expect.anything());
		});

		test('lets a subframe load anything, since it gets no credentials', async () => {
			await mountAndSettle();

			const allowed = mockWebViewProps.onShouldStartLoadWithRequest({ url: 'https://cdn.example.com/x', isTopFrame: false });

			expect(allowed).toBe(true);
			expect(openLink).not.toHaveBeenCalled();
		});

		test('opens window.open() http(s) urls externally', async () => {
			await mountAndSettle();
			jest.mocked(openLink).mockClear();

			mockWebViewProps.onOpenWindow({ nativeEvent: { targetUrl: 'https://docs.example.com/help' } });

			expect(openLink).toHaveBeenCalledWith('https://docs.example.com/help', expect.anything());
		});

		test('ignores window.open() custom schemes', async () => {
			await mountAndSettle();
			jest.mocked(openLink).mockClear();

			mockWebViewProps.onOpenWindow({ nativeEvent: { targetUrl: 'myapp://do-something' } });

			expect(openLink).not.toHaveBeenCalled();
		});
	});

	describe('credential cookies', () => {
		test('writes them before mounting the webview', async () => {
			const { queryByTestId } = mount();

			expect(queryByTestId('conference-webview')).toBeNull();

			await settle();

			expect(setServerCookies).toHaveBeenCalledWith(SERVER, { id: 'uid1', token: 'tok1' });
			expect(queryByTestId('conference-webview')).toBeTruthy();
		});

		test('does not write them for a url the server does not own', async () => {
			await mountAndSettle('https://evil.example.com/conference/call1');

			expect(setServerCookies).not.toHaveBeenCalled();
		});

		test('refreshing them does not tear down the running call', async () => {
			const { queryByTestId } = await mountAndSettle();

			expect(mockWebViewMounts).toBe(1);

			await act(async () => {
				mockedStore.dispatch(setUser({ id: 'uid1', token: 'tok2' }));
				await Promise.resolve();
			});

			expect(setServerCookies).toHaveBeenCalledTimes(2);
			expect(queryByTestId('conference-webview')).toBeTruthy();
			expect(mockWebViewMounts).toBe(1);
		});

		test('gates an untrusted->trusted transition on the cookie write', async () => {
			const { queryByTestId, rerender } = mount('https://evil.example.com/conference/call1');
			await settle();

			expect(setServerCookies).not.toHaveBeenCalled();
			expect(queryByTestId('conference-webview')).toBeTruthy();

			let resolveCookies!: () => void;
			(setServerCookies as jest.Mock).mockImplementationOnce(() => new Promise<void>(r => (resolveCookies = r)));

			rerender(
				<Wrapper>
					<ConferenceWebView url={CONFERENCE_URL} expanded onClose={jest.fn()} onOpenLink={jest.fn()} />
				</Wrapper>
			);

			expect(queryByTestId('conference-webview')).toBeNull();

			await act(async () => {
				resolveCookies();
				await Promise.resolve();
			});
			await settle();

			expect(setServerCookies).toHaveBeenCalledWith(SERVER, { id: 'uid1', token: 'tok1' });
			expect(queryByTestId('conference-webview')).toBeTruthy();
		});
	});
});
