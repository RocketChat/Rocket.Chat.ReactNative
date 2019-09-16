import React from 'react';
import PropTypes from 'prop-types';
import ActionSheet from 'react-native-action-sheet';

import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import I18n from '../i18n';

class MessageErrorActions extends React.Component {
	static propTypes = {
		actionsHide: PropTypes.func.isRequired,
		message: PropTypes.object
	};

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

	handleResend = protectedFunction(async() => {
		const { message } = this.props;
		await RocketChat.resendMessage(message);
	});

	handleDelete = protectedFunction(async() => {
		const { message } = this.props;
		const db = database.active;
		await db.action(async() => {
			await message.destroyPermanently();
		});
	})

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
		const { actionsHide } = this.props;
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
		actionsHide();
	}

	render() {
		return (
			null
		);
	}
}

export default MessageErrorActions;
