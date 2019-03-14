import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-action-sheet';

import { errorActionsHide as errorActionsHideAction } from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import I18n from '../i18n';

@connect(
	state => ({
		actionMessage: state.messages.actionMessage
	}),
	dispatch => ({
		errorActionsHide: () => dispatch(errorActionsHideAction())
	})
)
export default class MessageErrorActions extends React.Component {
	static propTypes = {
		errorActionsHide: PropTypes.func.isRequired,
		actionMessage: PropTypes.object
	};

	handleResend = protectedFunction(() => {
		const { actionMessage } = this.props;
		RocketChat.resendMessage(actionMessage._id);
	});

	handleDelete = protectedFunction(() => {
		const { actionMessage } = this.props;
		database.write(() => {
			const msg = database.objects('messages').filtered('_id = $0', actionMessage._id);
			database.delete(msg);
		});
	})

	// eslint-disable-next-line react/sort-comp
	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.options = [I18n.t('Cancel'), I18n.t('Delete'), I18n.t('Resend')];
		this.CANCEL_INDEX = 0;
		this.DELETE_INDEX = 1;
		this.RESEND_INDEX = 2;
		setTimeout(() => {
			this.showActionSheet();
		});
	}

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options: this.options,
			cancelButtonIndex: this.CANCEL_INDEX,
			destructiveButtonIndex: this.DELETE_INDEX,
			title: I18n.t('Message_actions')
		}, (actionIndex) => {
			this.handleActionPress(actionIndex);
		});
	}

	handleActionPress = (actionIndex) => {
		const { errorActionsHide } = this.props;
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
		errorActionsHide();
	}

	render() {
		return (
			null
		);
	}
}
