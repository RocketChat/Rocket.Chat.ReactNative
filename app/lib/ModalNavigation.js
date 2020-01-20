import { NavigationActions } from 'react-navigation';

let _navigatorModal;

function setTopLevelNavigator(navigatorRef) {
	_navigatorModal = navigatorRef;
}

function navigate(routeName, params) {
	_navigatorModal.dispatch(
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
