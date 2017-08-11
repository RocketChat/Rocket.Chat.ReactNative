import { NavigationActions } from 'react-navigation';

import PropTypes from 'prop-types';
import React from 'react';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';


class App extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}
	constructor(...args) {
		super(...args);
		const navigation = this.props.navigation;
		realm.objects('servers').addListener(() => {
			if (RocketChat.currentServer) {
				const resetAction = NavigationActions.reset({
					index: 0,
					actions: [
						NavigationActions.navigate({ routeName: 'Rooms' })
					]
				});
				navigation.dispatch(resetAction);
			}
		});
		if (RocketChat.currentServer) {
			RocketChat.connect();
		} else {
			const resetAction = NavigationActions.reset({
				index: 0,
				actions: [
					NavigationActions.navigate({ routeName: 'ListServerModal' })
				]
			});
			navigation.dispatch(resetAction);
		}
	}
	render() {
		return null;
	}
}
export default App;
