import { CommonActions } from '@react-navigation/native';

let _navigatorModal;

function setTopLevelNavigator(navigatorRef) {
	_navigatorModal = navigatorRef;
}

function navigate(name, params) {
	_navigatorModal.dispatch(
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
