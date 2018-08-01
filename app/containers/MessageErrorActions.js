import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';

import { errorActionsHide } from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import I18n from '../i18n';

@connect(
	state => ({
		actionMessage: state.messages.actionMessage
	}),
	dispatch => ({
		errorActionsHide: () => dispatch(errorActionsHide())
	})
)
export default class MessageErrorActions extends React.Component {
	static propTypes = {
		errorActionsHide: PropTypes.func.isRequired,
		actionMessage: PropTypes.object
	};

	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.options = [I18n.t('Cancel'), I18n.t('Delete'), I18n.t('Resend')];
		this.CANCEL_INDEX = 0;
		this.DELETE_INDEX = 1;
		this.RESEND_INDEX = 2;
		if (this.actionSheet && this.actionSheet.show) {
			this.actionSheet.show();
		}
	}

	handleResend = protectedFunction(() => RocketChat.resendMessage(this.props.actionMessage._id));

	handleDelete = protectedFunction(() => {
		database.write(() => {
			const msg = database.objects('messages').filtered('_id = $0', this.props.actionMessage._id);
			database.delete(msg);
		});
	})

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
				ref={o => this.actionSheet = o}
				title={I18n.t('Message_actions')}
				options={this.options}
				cancelButtonIndex={this.CANCEL_INDEX}
				destructiveButtonIndex={this.DELETE_INDEX}
				onPress={this.handleActionPress}
			/>
		);
	}
}
