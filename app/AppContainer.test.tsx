import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from './reducers';
import AppContainer from './AppContainer';
import { appStart } from './actions/app';
import { RootEnum } from './definitions';

// Mock Firebase analytics — the default __mocks__ file uses old API shape
jest.mock('@react-native-firebase/analytics', () => ({
	getAnalytics: () => ({
		logEvent: jest.fn(),
		logScreenView: jest.fn(),
		setAnalyticsCollectionEnabled: jest.fn()
	})
}));

// Mock navigation deps so we don't need a full native navigator
jest.mock('@react-navigation/native', () => {
	const React = require('react');
	const actualNav = jest.requireActual('@react-navigation/native');
	return {
		...actualNav,
		// eslint-disable-next-line react/display-name
		NavigationContainer: ({ children }: { children: any }) => React.createElement(React.Fragment, null, children),
		useFocusEffect: jest.fn(),
		useIsFocused: () => true,
		useRoute: () => ({}),
		useNavigation: () => ({ navigate: jest.fn(), addListener: () => jest.fn() }),
		createNavigationContainerRef: jest.fn(() => ({ current: null }))
	};
});

jest.mock('@react-navigation/native-stack', () => {
	const React = require('react');
	return {
		createNativeStackNavigator: () => ({
			// eslint-disable-next-line react/display-name
			Navigator: ({ children }: { children: any }) => React.createElement(React.Fragment, null, children),
			Screen: () => null
		})
	};
});

// Stub heavy screen components — we only care about MediaCallHeader rendering
jest.mock('./views/AuthLoadingView', () => 'AuthLoadingView');
jest.mock('./views/SetUsernameView', () => 'SetUsernameView');
jest.mock('./stacks/OutsideStack', () => 'OutsideStack');
jest.mock('./stacks/InsideStack', () => 'InsideStack');
jest.mock('./stacks/MasterDetailStack', () => 'MasterDetailStack');
jest.mock('./stacks/ShareExtensionStack', () => 'ShareExtensionStack');

// Mock MediaCallHeader with a testable placeholder
jest.mock('./containers/MediaCallHeader/MediaCallHeader', () => {
	const React = require('react');
	const { View } = require('react-native');
	// eslint-disable-next-line react/display-name
	return () => React.createElement(View, { testID: 'media-call-header-root' });
});

const makeStore = () => {
	const sagaMiddleware = createSagaMiddleware();
	return createStore(reducers, compose(applyMiddleware(sagaMiddleware)));
};

const renderWithRoot = (root: RootEnum, isMasterDetail = false) => {
	const React = require('react');
	const store = makeStore();
	store.dispatch(appStart({ root }));
	if (isMasterDetail) {
		store.dispatch({ type: 'APP/SET_MASTER_DETAIL', isMasterDetail: true });
	}
	return render(React.createElement(Provider, { store }, React.createElement(AppContainer)));
};

describe('AppContainer — MediaCallHeader gating', () => {
	it('renders MediaCallHeader when root is ROOT_INSIDE', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_INSIDE);
		expect(queryByTestId('media-call-header-root')).not.toBeNull();
	});

	it('renders MediaCallHeader when root is ROOT_INSIDE with master-detail layout', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_INSIDE, true);
		expect(queryByTestId('media-call-header-root')).not.toBeNull();
	});

	it('does not render MediaCallHeader when root is ROOT_OUTSIDE', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_OUTSIDE);
		expect(queryByTestId('media-call-header-root')).toBeNull();
	});

	it('does not render MediaCallHeader when root is ROOT_LOADING', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_LOADING);
		expect(queryByTestId('media-call-header-root')).toBeNull();
	});

	it('does not render MediaCallHeader when root is ROOT_SET_USERNAME', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_SET_USERNAME);
		expect(queryByTestId('media-call-header-root')).toBeNull();
	});

	it('does not render MediaCallHeader when root is ROOT_SHARE_EXTENSION', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_SHARE_EXTENSION);
		expect(queryByTestId('media-call-header-root')).toBeNull();
	});

	it('does not render MediaCallHeader when root is ROOT_LOADING_SHARE_EXTENSION', () => {
		const { queryByTestId } = renderWithRoot(RootEnum.ROOT_LOADING_SHARE_EXTENSION);
		expect(queryByTestId('media-call-header-root')).toBeNull();
	});
});
