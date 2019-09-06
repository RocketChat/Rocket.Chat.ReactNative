import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';
import { Q } from '@nozbe/watermelondb';

import database, { safeAddListener } from '../../../lib/realm';
import watermelondb from '../../../lib/database';
import Header from './Header';
import RightButtons from './RightButtons';

class RoomHeaderView extends Component {
	static propTypes = {
		title: PropTypes.string,
		type: PropTypes.string,
		prid: PropTypes.string,
		tmid: PropTypes.string,
		rid: PropTypes.string,
		window: PropTypes.object,
		status: PropTypes.string,
		connecting: PropTypes.bool,
		widthOffset: PropTypes.number,
		isLoggedUser: PropTypes.bool,
		userId: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.mounted = false;
		this.init();
		this.user = [];
		if (props.type === 'd' && !props.isLoggedUser) {
			this.user = database.memoryDatabase.objects('activeUsers').filtered('id == $0', props.userId);
			safeAddListener(this.user, this.updateUser);
		}
		this.state = {
			usersTyping: [],
			user: this.user[0] || {}
		};
	}

	componentDidMount() {
		this.mounted = true;
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
		if (this.user && this.user.removeAllListeners) {
			this.user.removeAllListeners();
		}
		if (this.usersTypingSubscription && this.usersTypingSubscription.unsubscribe) {
			this.usersTypingSubscription.unsubscribe();
		}
	}

	// eslint-disable-next-line react/sort-comp
	init() {
		const { rid } = this.props;
		const { memoryDatabase } = watermelondb;

		this.usersTypingObservable = memoryDatabase.collections
			.get('users_typing')
			.query(Q.where('rid', rid)).observe();

		this.usersTypingSubscription = this.usersTypingObservable
			.subscribe((usersTyping) => {
				if (this.mounted) {
					this.setState({ usersTyping });
				} else {
					this.state.usersTyping = usersTyping;
				}
			});
	}

	updateUser = () => {
		if (this.user.length) {
			this.setState({ user: this.user[0] });
		}
	}

	render() {
		const { usersTyping, user } = this.state;
		const {
			window, title, type, prid, tmid, widthOffset, isLoggedUser, status: userStatus, connecting
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
				widthOffset={widthOffset}
				connecting={connecting}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
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
};

export default responsive(connect(mapStateToProps)(RoomHeaderView));

export { RightButtons };
