import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { NavigationActions, StackActions } from 'react-navigation';
import KeyCommands from 'react-native-keycommands';

import Navigation from './lib/Navigation';
import { isSplited } from './utils/deviceInfo';
import {
	App, RoomContainer, ModalContainer, NotificationContainer
} from './index';
import { MAX_SIDEBAR_WIDTH } from './constants/tablet';
import ModalNavigation from './lib/ModalNavigation';
import { keyCommands, defaultCommands } from './commands';

import sharedStyles from './views/Styles';

let modalRef;
let roomRef;
let notificationRef;

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
		if (action.type === 'Navigation/RESET' && isSplited()) {
			const { params } = action.actions[action.index];
			const routes = state.routes[state.index] && state.routes[state.index].params;
			if (params && params.rid && routes && routes.rid && params.rid === routes.rid) {
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
		if (action.type === NavigationActions.NAVIGATE) {
			const { routeName, params } = action;

			if (routeName === 'InsideStack') {
				KeyCommands.setKeyCommands(defaultCommands);
				setState({ inside: true });
			}
			if (isSplited()) {
				if (routeName === 'InsideStack') {
					KeyCommands.setKeyCommands(keyCommands);
					const resetAction = StackActions.reset({
						index: 0,
						actions: [NavigationActions.navigate({ routeName: 'RoomView' })]
					});
					if (roomRef) {
						roomRef.dispatch(resetAction);
					}
				}
				if (routeName === 'ReadReceiptsView') {
					roomRef.dispatch(NavigationActions.navigate({ routeName, params }));
					return null;
				}
				if (routeName === 'OutsideStack') {
					KeyCommands.deleteKeyCommands([...defaultCommands, ...keyCommands]);
					setState({ inside: false, showModal: false });
				}
				if (routeName === 'JitsiMeetView') {
					inCall = true;
					KeyCommands.deleteKeyCommands([...defaultCommands, ...keyCommands]);
					setState({ inside: false, showModal: false });
				}
				if (routeName === 'OnboardingView') {
					KeyCommands.deleteKeyCommands([...defaultCommands, ...keyCommands]);
					setState({ inside: false, showModal: false });
				}

				if (routeName === 'RoomView') {
					const resetAction = StackActions.reset({
						index: 0,
						actions: [NavigationActions.navigate({ routeName, params })]
					});
					roomRef.dispatch(resetAction);
					notificationRef.dispatch(resetAction);
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
		}
		if (action.type === 'Navigation/TOGGLE_DRAWER' && isSplited()) {
			modalRef.dispatch(NavigationActions.navigate({ routeName: 'SettingsView' }));
			setState({ showModal: true });
			return null;
		}
		if (action.type === 'Navigation/POP' && inCall) {
			KeyCommands.setKeyCommands([...defaultCommands, ...keyCommands]);
			setState({ inside: true, showModal: false });
		}
		return defaultApp(action, state);
	};
};

const Tablet = ({
	children, tablet, inside, showModal, onLayout, close
}) => {
	const setModalRef = (ref) => {
		modalRef = ref;
		ModalNavigation.setTopLevelNavigator(modalRef);
	};

	const renderSplit = (split) => {
		if (split) {
			return (
				<>
					<View style={[sharedStyles.container, sharedStyles.separatorLeft]}>
						<RoomContainer ref={ref => roomRef = ref} screenProps={{ split: tablet }} />
					</View>
					<ModalContainer showModal={showModal} close={close} ref={setModalRef} screenProps={{ split: tablet }} />
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
			<NotificationContainer ref={ref => notificationRef = ref} />
		</View>
	);
};

Tablet.propTypes = {
	children: PropTypes.node,
	tablet: PropTypes.bool,
	inside: PropTypes.bool,
	showModal: PropTypes.bool,
	onLayout: PropTypes.func,
	close: PropTypes.func
};

export default Tablet;
