// import React from 'react';
// import { Provider } from 'react-redux';

// import store from './lib/createStore';

// import Routes from './containers/Routes';

// const RocketChat = () => (
// 	<Provider store={store}>
// 		<Routes />
// 	</Provider>
// );
// import React from 'react';
// import { Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';

import store from './lib/createStore';
import WithProvider from './views/WithProvider';
import NewServerView from './views/NewServerView';
import ListServerView from './views/ListServerView';

// export default RocketChat;
function start() {
	Navigation.registerComponent('NewServerView', () => WithProvider(NewServerView, store));
	Navigation.registerComponent('ListServerView', () => WithProvider(ListServerView, store));

	Navigation.events().registerAppLaunchedListener(() => {
		Navigation.setRoot({
			root: {
				stack: {
					children: [{
						component: {
							name: 'ListServerView'
						}
					}]
				}
			}
		});
	});
}

module.exports = {
	start
};
