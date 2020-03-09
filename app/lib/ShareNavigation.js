import { CommonActions } from '@react-navigation/native';

let _shareNavigator;

function setTopLevelNavigator(navigatorRef) {
	_shareNavigator = navigatorRef;
}

function navigate(name, params) {
	_shareNavigator.dispatch(
		CommonActions.navigate({
			name,
			params
		})
	);
}

export default {
	navigate,
	setTopLevelNavigator
};
