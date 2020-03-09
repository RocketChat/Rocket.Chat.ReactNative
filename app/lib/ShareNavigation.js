import { CommonActions } from '@react-navigation/native';

let _shareNavigator;

function setTopLevelNavigator(navigatorRef) {
	_shareNavigator = navigatorRef;
}

function navigate(routeName, params) {
	_shareNavigator.dispatch(
		CommonActions.navigate({
			routeName,
			params
		})
	);
}

export default {
	navigate,
	setTopLevelNavigator
};
