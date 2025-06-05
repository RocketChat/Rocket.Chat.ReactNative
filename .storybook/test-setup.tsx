import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import { themes } from '../app/lib/constants';
import MessageContext from '../app/containers/message/Context';
import { selectServerRequest } from '../app/actions/server';
import { mockedStore as store } from '../app/reducers/mockedStore';
import { setUser } from '../app/actions/login';

const baseUrl = 'https://open.rocket.chat';

// Setup store for stories
store.dispatch(selectServerRequest(baseUrl, '7.0.0'));
store.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat' }));

// Mock View for simplified testing
const MockView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children }) => (
  <>{children}</>
);

export const withProviders = (Component: React.ComponentType) => {
  return (props: any) => (
    <MockView style={{ flex: 1 }}>
      <Provider store={store}>
        <MessageContext.Provider
          value={{
            user: {
              id: 'y8bd77ptZswPj3EW8',
              username: 'diego.mello',
              token: 'abc'
            },
            baseUrl,
            onPress: jest.fn(),
            onLongPress: jest.fn(),
            reactionInit: jest.fn(),
            onErrorPress: jest.fn(),
            replyBroadcast: jest.fn(),
            onReactionPress: jest.fn(),
            onDiscussionPress: jest.fn(),
            onReactionLongPress: jest.fn(),
            threadBadgeColor: themes.light.badgeBackgroundLevel2
          }}
        >
          <Component {...props} />
        </MessageContext.Provider>
      </Provider>
    </MockView>
  );
};

export const renderWithProviders = (Component: React.ComponentType, props = {}) => {
  const WrappedComponent = withProviders(Component);
  return render(<WrappedComponent {...props} />);
};