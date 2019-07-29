import { NavigationActions } from 'react-navigation';

let _shareNavigator;

function setTopLevelNavigator(navigatorRef) {
	_shareNavigator = navigatorRef;
}

function navigate(routeName, params) {
	_shareNavigator.dispatch(
		NavigationActions.navigate({
			routeName,
			params
		})
	);
}

export default {
	navigate,
	setTopLevelNavigator
};
