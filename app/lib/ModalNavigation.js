import { CommonActions } from '@react-navigation/native';

let _navigatorModal;

function setTopLevelNavigator(navigatorRef) {
	_navigatorModal = navigatorRef;
}

function navigate(routeName, params) {
	_navigatorModal.dispatch(
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
