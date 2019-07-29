import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import database, { safeAddListener } from '../../../lib/realm';
import Header from './Header';
import RightButtons from './RightButtons';

@responsive
@connect((state, ownProps) => {
	let status;
	let userId;
	let isLoggedUser = false;
	const { rid, type } = ownProps;
	if (type === 'd') {
		if (state.login.user && state.login.user.id) {
			const { id: loggedUserId } = state.login.user;
			userId = rid.replace(loggedUserId, '').trim();
			isLoggedUser = userId === loggedUserId;
			if (isLoggedUser) {
				status = state.login.user.status; // eslint-disable-line
			}
		}
	}

	return {
		connecting: state.meteor.connecting,
		userId,
		isLoggedUser,
		status
	};
})
export default class RoomHeaderView extends Component {
	static propTypes = {
		title: PropTypes.string,
		type: PropTypes.string,
		prid: PropTypes.string,
		tmid: PropTypes.string,
		rid: PropTypes.string,
		window: PropTypes.object,
		status: PropTypes.string,
		connecting: PropTypes.bool,
		isLoggedUser: PropTypes.bool,
		userId: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.usersTyping = database.memoryDatabase.objects('usersTyping').filtered('rid = $0', props.rid);
		this.user = [];
		if (props.type === 'd' && !props.isLoggedUser) {
			this.user = database.memoryDatabase.objects('activeUsers').filtered('id == $0', props.userId);
			safeAddListener(this.user, this.updateUser);
		}
		this.state = {
			usersTyping: this.usersTyping.slice() || [],
			user: this.user[0] || {}
		};
		this.usersTyping.addListener(this.updateState);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { usersTyping, user } = this.state;
		const {
			type, title, status, window, connecting
		} = this.props;
		if (nextProps.type !== type) {
			return true;
		}
		if (nextProps.title !== title) {
			return true;
		}
		if (nextProps.status !== status) {
			return true;
		}
		if (nextProps.connecting !== connecting) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (nextProps.window.height !== window.height) {
			return true;
		}
		if (!equal(nextState.usersTyping, usersTyping)) {
			return true;
		}
		if (!equal(nextState.user, user)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.usersTyping.removeAllListeners();
		if (this.user && this.user.removeAllListeners) {
			this.user.removeAllListeners();
		}
	}

	updateState = () => {
		this.setState({ usersTyping: this.usersTyping.slice() });
	}

	updateUser = () => {
		if (this.user.length) {
			this.setState({ user: this.user[0] });
		}
	}

	render() {
		const { usersTyping, user } = this.state;
		const {
			window, title, type, prid, tmid, isLoggedUser, status: userStatus, connecting
		} = this.props;
		let status = 'offline';

		if (type === 'd') {
			if (isLoggedUser) {
				status = userStatus;
			} else {
				status = user.status || 'offline';
			}
		}

		return (
			<Header
				prid={prid}
				tmid={tmid}
				title={title}
				type={type}
				status={status}
				width={window.width}
				height={window.height}
				usersTyping={usersTyping}
				connecting={connecting}
			/>
		);
	}
}

export { RightButtons };
