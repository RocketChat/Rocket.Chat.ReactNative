import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import database from '../../../lib/realm';
import Header from './Header';
import RightButtons from './RightButtons';

@responsive
@connect((state, ownProps) => {
	let status = '';
	const { rid, type } = ownProps;
	if (type === 'd') {
		if (state.login.user && state.login.user.id) {
			const { id: loggedUserId } = state.login.user;
			const userId = rid.replace(loggedUserId, '').trim();
			if (userId === loggedUserId) {
				status = state.login.user.status; // eslint-disable-line
			} else {
				const user = state.activeUsers[userId];
				status = (user && user.status) || 'offline';
			}
		}
	}

	return {
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
		widthOffset: PropTypes.number
	};

	constructor(props) {
		super(props);
		this.usersTyping = database.memoryDatabase.objects('usersTyping').filtered('rid = $0', props.rid);
		this.state = {
			usersTyping: this.usersTyping.slice() || []
		};
		this.usersTyping.addListener(this.updateState);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { usersTyping } = this.state;
		const {
			type, title, status, window
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
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (nextProps.window.height !== window.height) {
			return true;
		}
		if (!equal(nextState.usersTyping, usersTyping)) {
			return true;
		}
		return false;
	}

	// componentDidUpdate(prevProps) {
	// 	if (isIOS) {
	// 		const { usersTyping } = this.props;
	// 		if (!equal(prevProps.usersTyping, usersTyping)) {
	// 			LayoutAnimation.easeInEaseOut();
	// 		}
	// 	}
	// }

	updateState = () => {
		this.setState({ usersTyping: this.usersTyping.slice() });
	}

	render() {
		const { usersTyping } = this.state;
		const {
			window, title, type, status, prid, tmid, widthOffset
		} = this.props;

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
			/>
		);
	}
}

export { RightButtons };
