import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { NotifierRoot, Notifier, Easing } from 'react-native-notifier';
import { responsive } from 'react-native-responsive-ui';

import { removeNotification as removeNotificationAction } from '../../actions/notification';
import NotifierComponent from './NotifierComponent';
import EventEmitter from './../../utils/events';

const ANIMATION_DURATION = 300;
const NOTIFICATION_DURATION = 3000;
const LISTENER = 'NotificationInApp'

class NotificationBadge extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		notification: PropTypes.object,
		window: PropTypes.object,
		theme: PropTypes.string,
		removeNotification: PropTypes.func
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.show);
	}

	shouldComponentUpdate(nextProps) {
		const { notification: nextNotification } = nextProps;
		const {
			notification: { payload }, window, theme
		} = this.props;
		console.log(nextProps, this.props);
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!equal(nextNotification.payload, payload)) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		return false;
	}

	componentWillMount () {
		EventEmitter.removeListener(LISTENER);
	}

	show = (notification) => {
		const { navigation } = this.props;
		const { payload } = notification;
		const navState = this.getNavState(navigation.state);
		if (payload.rid) {
			if (navState && navState.routeName === 'RoomView' && navState.params && navState.params.rid === payload.rid) {
				return;
			}
			Notifier.showNotification({
				showAnimationDuration: ANIMATION_DURATION,
				hideAnimationDuration: ANIMATION_DURATION,
				duration: NOTIFICATION_DURATION,
				hideOnPress: false,
				showEasing: Easing.inOut(Easing.quad),
				Component: NotifierComponent,
				componentProps: {
					navigation,
					hideNotification: this.hide
				}
			});
		}
	}


	hide = () => {
		const { removeNotification } = this.props;
		Notifier.hideNotification();
		removeNotification();
	}

	getNavState = (routes) => {
		if (!routes.routes) {
			return routes;
		}
		return this.getNavState(routes.routes[routes.index]);
	}

	render() {
		return (
			<NotifierRoot />
		);
	}
}

const mapStateToProps = state => ({
	notification: state.notification
});

const mapDispatchToProps = dispatch => ({
	removeNotification: () => dispatch(removeNotificationAction())
});

export default responsive(connect(mapStateToProps, mapDispatchToProps)((NotificationBadge)));
