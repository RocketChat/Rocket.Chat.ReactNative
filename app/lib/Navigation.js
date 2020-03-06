import { CommonActions } from '@react-navigation/native';

let _navigator;

function setTopLevelNavigator(navigatorRef) {
	_navigator = navigatorRef;
}

function back() {
	_navigator.dispatch(
		CommonActions.back()
	);
}

function navigate(name, params) {
	_navigator.dispatch(
		CommonActions.navigate({
			name,
			params
		})
	);
}

export default {
	back,
	navigate,
	setTopLevelNavigator
};
