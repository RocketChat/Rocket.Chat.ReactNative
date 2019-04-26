import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ViewPropTypes } from 'react-native';

import Status from './Status';
import database, { safeAddListener } from '../../lib/realm';

@connect(state => ({
	offline: !state.meteor.connected
}))
export default class StatusContainer extends React.PureComponent {
	static propTypes = {
		id: PropTypes.string,
		style: ViewPropTypes.style,
		size: PropTypes.number,
		offline: PropTypes.bool
	};

	static defaultProps = {
		size: 16
	}

	constructor(props) {
		super(props);
		this.user = database.memoryDatabase.objects('activeUsers').filtered('id == $0', props.id);
		this.state = {
			user: this.user[0] || {}
		};
		safeAddListener(this.user, this.updateState);
	}

	componentWillUnmount() {
		this.user.removeAllListeners();
	}

	get status() {
		const { user } = this.state;
		const { offline } = this.props;
		if (offline || !user) {
			return 'offline';
		}
		return user.status || 'offline';
	}

	updateState = () => {
		if (this.user.length) {
			this.setState({ user: this.user[0] });
		}
	}

	render() {
		const { style, size } = this.props;
		return <Status size={size} style={style} status={this.status} />;
	}
}
