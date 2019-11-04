import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { NavigationActions, StackActions } from 'react-navigation';

import KeyCommands from './commands';
import Navigation from './lib/Navigation';
import { isSplited } from './utils/deviceInfo';
import {
	App, RoomContainer, ModalContainer, NotificationContainer
} from './index';
import { MAX_SIDEBAR_WIDTH } from './constants/tablet';
import ModalNavigation from './lib/ModalNavigation';

import sharedStyles from './views/Styles';

let modalRef;
let roomRef;

export const initTabletNav = (setState) => {
	let inCall = false;

	const defaultApp = App.router.getStateForAction;
	const defaultModal = ModalContainer.router.getStateForAction;
	const defaultRoom = RoomContainer.router.getStateForAction;
	const defaultNotification = NotificationContainer.router.getStateForAction;

	NotificationContainer.router.getStateForAction = (action, state) => {
		if (action.type === NavigationActions.NAVIGATE && isSplited()) {
			const { routeName, params } = action;
			if (routeName === 'RoomView') {
				const resetAction = StackActions.reset({
					index: 0,
					actions: [NavigationActions.navigate({ routeName, params })]
				});
				roomRef.dispatch(resetAction);
			}
		}
		return defaultNotification(action, state);
	};

	RoomContainer.router.getStateForAction = (action, state) => {
		if (action.type === NavigationActions.NAVIGATE && isSplited()) {
			const { routeName, params } = action;
			if (routeName === 'RoomActionsView') {
				modalRef.dispatch(NavigationActions.navigate({ routeName, params }));
				setState({ showModal: true });
				return null;
			}
		}
		return defaultRoom(action, state);
	};

	ModalContainer.router.getStateForAction = (action, state) => {
		if (action.type === 'Navigation/POP' && isSplited()) {
			modalRef.dispatch(NavigationActions.navigate({ routeName: 'AuthLoading' }));
			setState({ showModal: false });
		}
		if (action.type === NavigationActions.NAVIGATE && isSplited()) {
			const { routeName, params } = action;
			if (routeName === 'RoomView') {
				Navigation.navigate(routeName, params);
			}
		}
		return defaultModal(action, state);
	};

	App.router.getStateForAction = (action, state) => {
		if (action.type === NavigationActions.NAVIGATE && isSplited()) {
			const { routeName, params } = action;

			if (routeName === 'InsideStack') {
				setState({ inside: true });
			}
			if (routeName === 'OutsideStack') {
				setState({ inside: false, showModal: false });
			}
			if (routeName === 'JitsiMeetView') {
				inCall = true;
				setState({ inside: false, showModal: false });
			}
			if (routeName === 'OnboardingView') {
				setState({ inside: false, showModal: false });
			}

			if (routeName === 'RoomView') {
				const resetAction = StackActions.reset({
					index: 0,
					actions: [NavigationActions.navigate({ routeName, params })]
				});
				roomRef.dispatch(resetAction);
				setState({ showModal: false });
				return null;
			}

			if (routeName === 'NewMessageView') {
				modalRef.dispatch(NavigationActions.navigate({ routeName, params }));
				setState({ showModal: true });
				return null;
			}
			if (routeName === 'DirectoryView') {
				modalRef.dispatch(NavigationActions.navigate({ routeName }));
				setState({ showModal: true });
				return null;
			}
		}
		if (action.type === 'Navigation/TOGGLE_DRAWER' && isSplited()) {
			modalRef.dispatch(NavigationActions.navigate({ routeName: 'SettingsView' }));
			setState({ showModal: true });
			return null;
		}
		if (action.type === 'Navigation/POP' && inCall) {
			setState({ inside: true, showModal: false });
		}
		return defaultApp(action, state);
	};
};

const Tablet = ({
	children, tablet, inside, showModal, onLayout
}) => {
	const setModalRef = (ref) => {
		modalRef = ref;
		ModalNavigation.setTopLevelNavigator(modalRef);
	};

	const renderSplit = (split) => {
		if (split) {
			return (
				<>
					<KeyCommands>
						<View style={[sharedStyles.container, sharedStyles.separatorLeft]}>
							<RoomContainer ref={ref => roomRef = ref} />
						</View>
					</KeyCommands>
					<ModalContainer showModal={showModal} ref={setModalRef} />
				</>
			);
		}
		return null;
	};

	const split = tablet && inside;
	return (
		<View style={sharedStyles.containerSplitView} onLayout={onLayout}>
			<View style={[sharedStyles.container, split && { maxWidth: MAX_SIDEBAR_WIDTH }]}>
				{children}
			</View>
			{renderSplit(split)}
			<NotificationContainer />
		</View>
	);
};

Tablet.propTypes = {
	children: PropTypes.node,
	tablet: PropTypes.bool,
	inside: PropTypes.bool,
	showModal: PropTypes.bool,
	onLayout: PropTypes.func
};

export default Tablet;
