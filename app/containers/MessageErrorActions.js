import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';

import { errorActionsHide } from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';

@connect(
	state => ({
		showErrorActions: state.messages.showErrorActions,
		actionMessage: state.messages.actionMessage
	}),
	dispatch => ({
		errorActionsHide: () => dispatch(errorActionsHide())
	})
)
export default class MessageActions extends React.Component {
	static propTypes = {
		errorActionsHide: PropTypes.func.isRequired,
		showErrorActions: PropTypes.bool.isRequired,
		actionMessage: PropTypes.object
	};

	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.options = ['Cancel', 'Delete', 'Resend'];
		this.CANCEL_INDEX = 0;
		this.DELETE_INDEX = 1;
		this.RESEND_INDEX = 2;
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.showErrorActions !== this.props.showErrorActions && nextProps.showErrorActions) {
			this.ActionSheet.show();
		}
	}

	handleResend = () => RocketChat.resendMessage(this.props.actionMessage._id);

	handleDelete = () => {
		database.write(() => {
			const msg = database.objects('messages').filtered('_id = $0', this.props.actionMessage._id);
			database.delete(msg);
		});
	}

	handleActionPress = (actionIndex) => {
		switch (actionIndex) {
			case this.RESEND_INDEX:
				this.handleResend();
				break;
			case this.DELETE_INDEX:
				this.handleDelete();
				break;
			default:
				break;
		}
		this.props.errorActionsHide();
	}

	render() {
		return (
			<ActionSheet
				ref={o => this.ActionSheet = o}
				title='Messages actions'
				options={this.options}
				cancelButtonIndex={this.CANCEL_INDEX}
				destructiveButtonIndex={this.DELETE_INDEX}
				onPress={this.handleActionPress}
			/>
		);
	}
}
