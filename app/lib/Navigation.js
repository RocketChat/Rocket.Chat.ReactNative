import { CommonActions } from '@react-navigation/native';

let _navigator;

function setTopLevelNavigator(navigatorRef) {
	_navigator = navigatorRef;
}

function goBack() {
	_navigator.dispatch(
		CommonActions.goBack()
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
	goBack,
	navigate,
	setTopLevelNavigator
};
