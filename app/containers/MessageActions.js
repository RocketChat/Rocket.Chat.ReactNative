import React from 'react';
import PropTypes from 'prop-types';
import {
	Alert, Clipboard, Share, View, Text, StyleSheet, TouchableWithoutFeedback
} from 'react-native';
import { connect } from 'react-redux';
import * as moment from 'moment';
import BottomSheet from 'reanimated-bottom-sheet';
import Animated from 'react-native-reanimated';
import Touchable from 'react-native-platform-touchable';
import { RectButton } from 'react-native-gesture-handler';

import {
	deleteRequest as deleteRequestAction,
	editInit as editInitAction,
	replyInit as replyInitAction,
	togglePinRequest as togglePinRequestAction,
	toggleReactionPicker as toggleReactionPickerAction,
	toggleStarRequest as toggleStarRequestAction
} from '../actions/messages';
import { showToast } from '../utils/info';
import { verticalScale } from '../utils/scaling';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { CustomIcon } from '../lib/Icons';
import { isIOS } from '../utils/deviceInfo';
import bottomSheetStatus from '../constants/bottomSheetStatus';

const {
	block, cond, call, eq, lessThan
} = Animated;

const bottomSheetMaxHeight = verticalScale(270);
const bottomSheetInitialHeight = 0;
const bottomSheetHeaderHeight = 25;
const buttonPaddingsSize = verticalScale(25);
const textSize = 13;

const styles = StyleSheet.create({
	panel: {
		height: verticalScale(500),
		padding: verticalScale(5),
		backgroundColor: '#f3f3f3'
	},
	panelButton: {
		padding: verticalScale(10),
		backgroundColor: 'transparent',
		borderBottomWidth: 1,
		borderBottomColor: '#dadada',
		flexDirection: 'row'
	},
	panelButtonIcon: {
		paddingHorizontal: 5
	},
	header: {
		backgroundColor: '#f3f3f3',
		paddingTop: 15,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20
	},
	panelHeader: {
		alignItems: 'center'
	},
	panelHandle: {
		width: 40,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#dadada'
	},
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: '#000000',
		opacity: 0
	},
	androidButtonView: {
		borderBottomWidth: 1,
		borderBottomColor: '#dadada'
	}
});

@connect(
	state => ({
		actionMessage: state.messages.actionMessage,
		Message_AllowDeleting: state.settings.Message_AllowDeleting,
		Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
		Message_AllowEditing: state.settings.Message_AllowEditing,
		Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
		Message_AllowPinning: state.settings.Message_AllowPinning,
		Message_AllowStarring: state.settings.Message_AllowStarring
	}),
	dispatch => ({
		deleteRequest: message => dispatch(deleteRequestAction(message)),
		editInit: message => dispatch(editInitAction(message)),
		toggleStarRequest: message => dispatch(toggleStarRequestAction(message)),
		togglePinRequest: message => dispatch(togglePinRequestAction(message)),
		toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
		replyInit: (message, mention) => dispatch(replyInitAction(message, mention))
	})
)
export default class MessageActions extends React.Component {
	static propTypes = {
		room: PropTypes.object.isRequired,
		actionMessage: PropTypes.object,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		toggleStarRequest: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		toggleReactionPicker: PropTypes.func.isRequired,
		replyInit: PropTypes.func.isRequired,
		Message_AllowDeleting: PropTypes.bool,
		Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
		Message_AllowEditing: PropTypes.bool,
		Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
		Message_AllowPinning: PropTypes.bool,
		Message_AllowStarring: PropTypes.bool,
		setRef: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.state = {
			isBottomSheetVisible: false
		};
		this.setPermissions();
		const { Message_AllowStarring, Message_AllowPinning, setRef } = this.props;

		this.bottomSheetRef = React.createRef();
		setRef(this.bottomSheetRef);

		this.options = [
			{ label: I18n.t('Cancel'), handler: () => {}, icon: 'circle-cross' },
			{ label: I18n.t('Permalink'), handler: this.handlePermalink, icon: 'permalink' },
			{ label: I18n.t('Copy'), handler: this.handleCopy, icon: 'copy' },
			{ label: I18n.t('Share'), handler: this.handleShare, icon: 'share' }
		];

		if (!this.isRoomReadOnly()) {
			this.options.push({ label: I18n.t('Reply'), handler: this.handleReply, icon: 'reply' });
		}

		if (this.allowEdit(props)) {
			this.options.push({ label: I18n.t('Edit'), handler: this.handleEdit, icon: 'edit' });
		}

		if (!this.isRoomReadOnly()) {
			this.options.push({ label: I18n.t('Quote'), handler: this.handleQuote, icon: 'quote' });
		}

		if (Message_AllowStarring) {
			this.options.push({ label: I18n.t(props.actionMessage && props.actionMessage.starred ? 'Unstar' : 'Star'), handler: this.handleStar, icon: 'star' });
		}

		if (Message_AllowPinning) {
			this.options.push({ label: I18n.t(props.actionMessage && props.actionMessage.pinned ? 'Unpin' : 'Pin'), handler: this.handlePin, icon: 'pin' });
		}

		if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
			this.options.push({ label: I18n.t('Add_Reaction'), handler: this.handleReaction, icon: 'emoji' });
		}

		if (this.allowDelete(props)) {
			this.options.push({ label: I18n.t('Delete'), handler: this.handleDelete, icon: 'cross' });
		}

		this.options.reverse(); // reversing to put `cancel` button to the bottom of the list

		this.value_fall = new Animated.Value(1);
		this.bottomSheetHeight = this.options.length * buttonPaddingsSize + this.options.length * textSize + bottomSheetHeaderHeight;
	}

	setPermissions() {
		const { room } = this.props;
		const permissions = ['edit-message', 'delete-message', 'force-delete-message'];
		const result = RocketChat.hasPermission(permissions, room.rid);
		this.hasEditPermission = result[permissions[0]];
		this.hasDeletePermission = result[permissions[1]];
		this.hasForceDeletePermission = result[permissions[2]];
	}

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalink(message);
		} catch (error) {
			return null;
		}
	}

	isOwn = props => props.actionMessage && props.actionMessage.u && props.actionMessage.u._id === props.user.id;

	isRoomReadOnly = () => {
		const { room } = this.props;
		return room.ro;
	}

	canReactWhenReadOnly = () => {
		const { room } = this.props;
		return room.reactWhenReadOnly;
	}

	allowEdit = (props) => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const editOwn = this.isOwn(props);
		const { Message_AllowEditing: isEditAllowed, Message_AllowEditing_BlockEditInMinutes } = this.props;

		if (!(this.hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}
		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (props.actionMessage && props.actionMessage.ts != null) {
				msgTs = moment(props.actionMessage.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	}

	allowDelete = (props) => {
		if (this.isRoomReadOnly()) {
			return false;
		}

		// Prevent from deleting thread start message when positioned inside the thread
		if (props.tmid && props.actionMessage && props.tmid === props.actionMessage._id) {
			return false;
		}
		const deleteOwn = this.isOwn(props);
		const { Message_AllowDeleting: isDeleteAllowed, Message_AllowDeleting_BlockDeleteInMinutes } = this.props;
		if (!(this.hasDeletePermission || (isDeleteAllowed && deleteOwn) || this.hasForceDeletePermission)) {
			return false;
		}
		if (this.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (props.actionMessage && props.actionMessage.ts != null) {
				msgTs = moment(props.actionMessage.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	}

	handleDelete = () => {
		const { deleteRequest, actionMessage } = this.props;
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('You_will_not_be_able_to_recover_this_message'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: 'delete' }),
					style: 'destructive',
					onPress: () => deleteRequest(actionMessage)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit = () => {
		const { actionMessage, editInit } = this.props;
		const { _id, msg, rid } = actionMessage;
		editInit({ _id, msg, rid });
	}

	handleCopy = async() => {
		const { actionMessage } = this.props;
		await Clipboard.setString(actionMessage.msg);
		showToast(I18n.t('Copied_to_clipboard'));
	};

	handleShare = async() => {
		const { actionMessage } = this.props;
		const permalink = await this.getPermalink(actionMessage);
		Share.share({
			message: permalink
		});
	}

	handleStar = () => {
		const { actionMessage, toggleStarRequest } = this.props;
		toggleStarRequest(actionMessage);
	}

	handlePermalink = async() => {
		const { actionMessage } = this.props;
		const permalink = await this.getPermalink(actionMessage);
		Clipboard.setString(permalink);
		showToast(I18n.t('Permalink_copied_to_clipboard'));
	}

	handlePin = () => {
		const { actionMessage, togglePinRequest } = this.props;
		togglePinRequest(actionMessage);
	}

	handleReply = () => {
		const { actionMessage, replyInit } = this.props;
		replyInit(actionMessage, true);
	}

	handleQuote = () => {
		const { actionMessage, replyInit } = this.props;
		replyInit(actionMessage, false);
	}

	handleReaction = () => {
		const { actionMessage, toggleReactionPicker } = this.props;
		toggleReactionPicker(actionMessage);
	}

	renderHeader = () => (
		<View style={styles.header}>
			<View style={styles.panelHeader}>
				<View style={styles.panelHandle} />
			</View>
		</View>
	);

	buttonIcon = icon => (
		<CustomIcon name={icon} size={18} style={styles.panelButtonIcon} />
	)

	buttonText = label => (
		<Text style={sharedStyles.textRegular}>{label}</Text>
	)

	renderInner = () => (
		<View style={[styles.panel, { height: this.bottomSheetHeight }]}>
			{this.options.map(option => (
				isIOS
					? (
						<Touchable onPress={() => { this.hideActionSheet(); option.handler(); }} key={option.label}>
							<View style={styles.panelButton}>
								{this.buttonIcon(option.icon)}
								{this.buttonText(option.label)}
							</View>
						</Touchable>
					)
					: (
						<View style={styles.androidButtonView}>
							<RectButton onPress={() => { this.hideActionSheet(); option.handler(); }} key={option.label} style={styles.panelButton}>
								{this.buttonIcon(option.icon)}
								{this.buttonText(option.label)}
							</RectButton>
						</View>
					)
			))}
		</View>
	);

	bottomSheetCallback = ([value]) => {
		// 1 is closed; value < 1 && value > 0 is opened
		const isBottomSheetVisible = value <= 1 - (bottomSheetMaxHeight / (this.bottomSheetHeight + bottomSheetHeaderHeight));
		this.setState({ isBottomSheetVisible });
	}

	hideActionSheet() {
		return this.bottomSheetRef && this.bottomSheetRef.current && this.bottomSheetRef.current.snapTo(bottomSheetStatus.HIDDEN);
	}

	render() {
		const { isBottomSheetVisible } = this.state;

		return (
			[
				(isBottomSheetVisible && (
					<TouchableWithoutFeedback onPress={() => this.hideActionSheet()}>
						<Animated.View style={styles.backdrop} />
					</TouchableWithoutFeedback>
				)),
				<BottomSheet
					ref={this.bottomSheetRef}
					initialSnap={bottomSheetStatus.HIDDEN}
					snapPoints={[bottomSheetMaxHeight, this.bottomSheetHeight + bottomSheetHeaderHeight, bottomSheetInitialHeight]}
					renderHeader={this.renderHeader}
					renderContent={this.renderInner}
					enabledManualSnapping
					enabledGestureInteraction
					enabledInnerScrolling
					callbackNode={this.value_fall}
				/>,
				<Animated.Code
					exec={
						block([
							// this.value_fall === 0 is opened with bottomSheetMaxHeight; === 1 - (bottomSheetMaxHeight / (this.bottomSheetHeight + bottomSheetHeaderHeight) is opened partly
							cond(lessThan(this.value_fall, 1 - (bottomSheetMaxHeight / (this.bottomSheetHeight + bottomSheetHeaderHeight))), call([this.value_fall], this.bottomSheetCallback)),
							// this.value_fall === 1 is closed
							cond(eq(this.value_fall, 1), call([this.value_fall], this.bottomSheetCallback))
						])
					}
				/>
			]
		);
	}
}
