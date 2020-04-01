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
import { themes } from './constants/colors';

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
			if (routeName === 'AttachmentView') {
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
				let commands = defaultCommands;
				let newState = { inside: true };
				if (isSplited()) {
					commands = [...commands, ...keyCommands];
					newState = { ...newState, showModal: false };
				}
				KeyCommands.setKeyCommands(commands);
				setState(newState);
			}
			if (isSplited()) {
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
				if (routeName === 'OnboardingView' || routeName === 'NewServerView') {
					KeyCommands.deleteKeyCommands([...defaultCommands, ...keyCommands]);
					setState({ inside: false, showModal: false });
				}
				if (routeName === 'ModalBlockView' || routeName === 'StatusView' || routeName === 'CreateDiscussionView') {
					modalRef.dispatch(NavigationActions.navigate({ routeName, params }));
					setState({ showModal: true });
					return null;
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

				if (routeName === 'RoomsListView') {
					const resetAction = StackActions.reset({
						index: 0,
						actions: [NavigationActions.navigate({ routeName: 'RoomView', params: {} })]
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

const Split = ({
	split, tablet, showModal, closeModal, setModalRef, theme
}) => {
	if (split) {
		return (
			<>
				<View style={[sharedStyles.container, sharedStyles.separatorLeft, { borderColor: themes[theme].separatorColor }]}>
					<RoomContainer ref={ref => roomRef = ref} screenProps={{ split: tablet, theme }} />
				</View>
				<ModalContainer showModal={showModal} closeModal={closeModal} ref={setModalRef} screenProps={{ split: tablet, theme }} />
			</>
		);
	}
	return null;
};

const Tablet = ({
	children, tablet, theme, inside, showModal, closeModal, onLayout
}) => {
	const setModalRef = (ref) => {
		modalRef = ref;
		ModalNavigation.setTopLevelNavigator(modalRef);
	};

	const split = tablet && inside;
	return (
		<View style={sharedStyles.containerSplitView} onLayout={onLayout}>
			<View style={[sharedStyles.container, split && { maxWidth: MAX_SIDEBAR_WIDTH }]}>
				{children}
			</View>
			<Split split={split} tablet={tablet} theme={theme} showModal={showModal} closeModal={closeModal} setModalRef={setModalRef} />
			<NotificationContainer ref={ref => notificationRef = ref} screenProps={{ theme }} />
		</View>
	);
};

Split.propTypes = {
	split: PropTypes.bool,
	tablet: PropTypes.bool,
	showModal: PropTypes.bool,
	closeModal: PropTypes.func,
	setModalRef: PropTypes.func,
	theme: PropTypes.string
};

Tablet.propTypes = {
	children: PropTypes.node,
	tablet: PropTypes.bool,
	inside: PropTypes.bool,
	showModal: PropTypes.bool,
	closeModal: PropTypes.func,
	onLayout: PropTypes.func,
	theme: PropTypes.string
};

export default Tablet;
