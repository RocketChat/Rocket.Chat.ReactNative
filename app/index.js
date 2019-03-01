import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens';

import { appInit } from './actions';
import OnboardingView from './views/OnboardingView';
import NewServerView from './views/NewServerView';
import store from './lib/createStore';

useScreens();

store.dispatch(appInit());
// store.subscribe(this.onStoreUpdate.bind(this));

const AppNavigator = createStackNavigator({
	OnboardingView,
	NewServerView
});

const App = createAppContainer(AppNavigator);

// export default createAppContainer(AppNavigator);
// class App extends React.Component {
//   render() {
//     return (
//       <AppNavigator />
//     );
//   }
// }
export default () => (
	<Provider store={store}>
		<App />
	</Provider>
);
