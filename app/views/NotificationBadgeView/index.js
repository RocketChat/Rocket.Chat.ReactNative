import React from 'react';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import PropTypes from 'prop-types';

import RocketChat from '../../lib/rocketchat';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import Badge from './Badge';
import log from '../../utils/log';

const removeListener = listener => listener.stop();
let notificationListener;

@connect(state => ({
	login: state.login
}))
export default class NotificationBadge extends React.Component {
	static propTypes = {
		login: PropTypes.object
	}

	handleNotificationReceived = protectedFunction((notification) => {
		const [, ev] = notification.fields.eventName.split('/');
		if (/notification/.test(ev)) {
			const [data] = notification.fields.args;
			this.setState({
				data
			});
		}
	});

	constructor(props) {
		super('NotificationBadge', props);
		this.state = {
			data: null
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { login } = this.props;
		const { data } = this.state;
		if (!equal(nextProps.login, login)) {
			notificationListener = RocketChat.onStreamData('stream-notify-user', this.handleNotificationReceived);
		}
		if (!equal(nextState.data, data)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (notificationListener) {
			notificationListener.then(removeListener);
			notificationListener = false;
		}
	}

	render() {
		const { data } = this.state;
		if	(data) {
			return (
				<Badge
					data={data.payload}
					message={data.text}
				/>
			);
		}
		return null;
	}
}
