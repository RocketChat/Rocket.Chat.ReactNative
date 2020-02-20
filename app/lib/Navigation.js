import { NavigationActions } from 'react-navigation';

let _navigator;

function setTopLevelNavigator(navigatorRef) {
	_navigator = navigatorRef;
}

function back() {
	_navigator.dispatch(
		NavigationActions.back()
	);
}

function navigate(routeName, params) {
	_navigator.dispatch(
		NavigationActions.navigate({
			routeName,
			params
		})
	);
}

export default {
	back,
	navigate,
	setTopLevelNavigator
};
