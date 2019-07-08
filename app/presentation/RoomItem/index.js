import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, Dimensions, TouchableOpacity, Image } from 'react-native';
import { connect } from 'react-redux';
// import { RectButton, PanGestureHandler, State } from 'react-native-gesture-handler';

import Animated from 'react-native-reanimated';
import { State, RectButton } from 'react-native-gesture-handler';
import Interactable from './Interactable';

const { cond, eq, call } = Animated;

const Screen = Dimensions.get('window');
const BUTTON_WIDTH = 78
import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles, { ROW_HEIGHT, OPTION_WIDTH } from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import { CustomIcon } from '../../lib/Icons';

export { ROW_HEIGHT };

const SMALL_SWIPE = 40;
const attrs = ['name', 'unread', 'userMentions', 'showLastMessage', 'alert', 'type', 'width'];
@connect(state => ({
	userId: state.login.user && state.login.user.id,
	username: state.login.user && state.login.user.username,
	token: state.login.user && state.login.user.token
}))
export default class RoomItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		showLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.string,
		lastMessage: PropTypes.object,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		id: PropTypes.string,
		prid: PropTypes.string,
		onPress: PropTypes.func,
		userId: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string,
		avatarSize: PropTypes.number,
		testID: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
		favorite: PropTypes.bool,
		isRead: PropTypes.bool,
		rid: PropTypes.string,
		toggleFav: PropTypes.func,
		toggleRead: PropTypes.func,
		hideChannel: PropTypes.func
	}

	static defaultProps = {
		avatarSize: 48
	}

	// Making jest happy: https://github.com/facebook/react-native/issues/22175
	// eslint-disable-next-line no-useless-constructor
	// constructor(props) {
	// 	super(props);
	// 	const dragX = new Animated.Value(0);
	// 	const rowOffSet = new Animated.Value(0);
	// 	this.rowTranslation = Animated.add(
	// 		rowOffSet,
	// 		dragX
	// 	);
	// 	this.state = {
	// 		dragX,
	// 		rowOffSet,
	// 		rowState: 0 // 0: closed, 1: right opened, -1: left opened
	// 	};
	// 	this._onGestureEvent = Animated.event(
	// 		[{ nativeEvent: { translationX: dragX } }]
	// 	);
	// 	this._value = 0;
	// 	this.rowTranslation.addListener(({ value }) => { this._value = value; });
	// }
	// button = React.createRef();

	constructor(props) {
		super(props);
		this._deltaX = new Animated.Value(0);
		this.state = {
			position: 1
		}
	}

	// shouldComponentUpdate(nextProps) {
	// 	const { lastMessage, _updatedAt, isRead } = this.props;
	// 	const oldlastMessage = lastMessage;
	// 	const newLastmessage = nextProps.lastMessage;

	// 	if (oldlastMessage && newLastmessage && oldlastMessage.ts !== newLastmessage.ts) {
	// 		return true;
	// 	}
	// 	if (_updatedAt && nextProps._updatedAt && nextProps._updatedAt !== _updatedAt) {
	// 		return true;
	// 	}
	// 	if (isRead !== nextProps.isRead) {
	// 		return true;
	// 	}
	// 	// eslint-disable-next-line react/destructuring-assignment
	// 	return attrs.some(key => nextProps[key] !== this.props[key]);
	// }

	// componentWillUnmount() {
	// 	this.rowTranslation.removeAllListeners();
	// }

	// _onHandlerStateChange = ({ nativeEvent }) => {
	// 	if (nativeEvent.oldState === State.ACTIVE) {
	// 		this._handleRelease(nativeEvent);
	// 	}
	// };

	handleLeftButtonPress = () => {
		this.toggleRead();
		setTimeout(() => {
			this.close();
		})
	}

	close = () => this.interactableElem && this.interactableElem._snapAnchor && this.interactableElem._snapAnchor.x && this.interactableElem._snapAnchor.x.setValue(0)

	toggleFav = () => {
		const { toggleFav, rid, favorite } = this.props;
		if (toggleFav) {
			toggleFav(rid, favorite);
		}
		this.close();
	}

	toggleRead = () => {
		const { toggleRead, rid, isRead } = this.props;
		if (toggleRead) {
			toggleRead(rid, isRead);
		}
	}

	handleHideButtonPress = () => {
		this.hideChannel();
		this.close();
	}

	hideChannel = () => {
		const { hideChannel, rid, type } = this.props;
		if (hideChannel) {
			hideChannel(rid, type);
		}
	}

	onPress = () => {
		const { position } = this.state;
		if (position !== 1) {
			this.close();
			return;
		}
		const { onPress } = this.props;
		if (onPress) {
			onPress();
		}
	}

	renderLeftActions = () => {
		const { isRead, width } = this.props;
		const translateX = this._deltaX.interpolate({
			inputRange: [0, OPTION_WIDTH],
			outputRange: [-OPTION_WIDTH, 0]
		});
		return (
			<View
				style={{ position: 'absolute', left: 0, right: 0, height: '100%' }}
				// pointerEvents='box-none'
			>
				<Animated.View
					style={[
						{
							position: 'absolute',
							top: 0,
							right: width - OPTION_WIDTH,
							width,
							height: '100%',
							backgroundColor: '#497AFC',
							justifyContent: 'center',
							alignItems: 'flex-end'
						},
						{
							transform: [{ translateX }]
						}
					]}
				>
					<RectButton style={styles.actionButtonLeft} onPress={this.handleLeftButtonPress}>
						<React.Fragment>
							<CustomIcon size={20} name={isRead ? 'flag' : 'check'} color='white' />
							<Text style={styles.actionText}>{I18n.t(isRead ? 'Unread' : 'Read')}</Text>
						</React.Fragment>
					</RectButton>
				</Animated.View>
			</View>
		)
	};

	renderRightActions = () => {
		const { favorite, width } = this.props;
		// const halfWidth = width / 2;
		// const trans = this.rowTranslation.interpolate({
		// 	inputRange: [-OPTION_WIDTH, 0],
		// 	outputRange: [width - OPTION_WIDTH, width]
		// });
		// const iconHideTrans = this.rowTranslation.interpolate({
		// 	inputRange: [-(halfWidth - 20), -2 * OPTION_WIDTH, 0],
		// 	outputRange: [0, 0, -OPTION_WIDTH]
		// });
		// const iconFavWidth = this.rowTranslation.interpolate({
		// 	inputRange: [-halfWidth, -2 * OPTION_WIDTH, 0],
		// 	outputRange: [0, OPTION_WIDTH, OPTION_WIDTH],
		// 	extrapolate: 'clamp'
		// });
		// const iconHideWidth = this.rowTranslation.interpolate({
		// 	inputRange: [-width, -halfWidth, -2 * OPTION_WIDTH, 0],
		// 	outputRange: [width, halfWidth, OPTION_WIDTH, OPTION_WIDTH]
		// });
		// return (
		// 	<Animated.View
		// 		style={[
		// 			styles.rightAction,
		// 			{ transform: [{ translateX: trans }] }
		// 		]}
		// 	>
		// 		<Animated.View
		// 			style={{ width: iconFavWidth }}
		// 		>
		// 			<RectButton style={[styles.actionButtonRightFav]} onPress={this.toggleFav}>
		// 				{favorite ? (
		// 					<View style={styles.actionView}>
		// 						<CustomIcon size={20} name='Star-filled' color='white' />
		// 						<Text style={styles.actionText}>{I18n.t('Unfavorite')}</Text>
		// 					</View>
		// 				) : (
		// 					<View style={styles.actionView}>
		// 						<CustomIcon size={20} name='star' color='white' />
		// 						<Text style={styles.actionText}>{I18n.t('Favorite')}</Text>
		// 					</View>
		// 				)}
		// 			</RectButton>
		// 		</Animated.View>
		// 		<Animated.View style={[
		// 			{ width: iconHideWidth },
		// 			{ transform: [{ translateX: iconHideTrans }] }
		// 		]}
		// 		>
		// 			<RectButton
		// 				style={[styles.actionButtonRightHide]}
		// 				onPress={this.handleHideButtonPress}
		// 			>
		// 				<View style={styles.actionView}>
		// 					<CustomIcon size={20} name='eye-off' color='white' />
		// 					<Text style={styles.actionText}>{I18n.t('Hide')}</Text>
		// 				</View>
		// 			</RectButton>
		// 		</Animated.View>
		// 	</Animated.View>
		// );
		return (
			<View
				style={{ position: 'absolute', left: 0, right: 0, height: 75 }}
				// pointerEvents="box-none"
			>
				<Animated.View
					style={[
						{
							position: 'absolute',
							top: 0,
							// left: Screen.width - 155,
							width: Screen.width,  // change me
							height: 75,
							// paddingLeft: 18,
							backgroundColor: '#f8a024',
							justifyContent: 'center',
						},
						{
							// transform: [
							//   {
							//     translateX: Screen.width - BUTTON_WIDTH * 2
							//   }
							// ]
							transform: [
								{
									translateX: this._deltaX.interpolate({
										inputRange: [-Screen.width / 2, -BUTTON_WIDTH * 2, 0],
										outputRange: [Screen.width / 2, Screen.width - BUTTON_WIDTH * 2, Screen.width],
										// extrapolate: Animated.Extrapolate.CLAMP
									}),
									// translateX: iconHideTrans
								},
							],
						},
					]}>
					<RectButton style={[styles.actionButtonRightFav]} onPress={this.toggleFav}>
						{favorite ? (
							<View style={styles.actionView}>
								<CustomIcon size={20} name='Star-filled' color='white' />
								<Text style={styles.actionText}>{I18n.t('Unfavorite')}</Text>
							</View>
						) : (
							<View style={styles.actionView}>
								<CustomIcon size={20} name='star' color='white' />
								<Text style={styles.actionText}>{I18n.t('Favorite')}</Text>
							</View>
						)}
					</RectButton>
				</Animated.View>

				<Animated.View
					style={[
						{
							position: 'absolute',
							top: 0,
							// left: Screen.width - 78,
							width: Screen.width, // change me
							height: 75,
							// paddingLeft: 18,
							backgroundColor: '#4f7db0',
							justifyContent: 'center',
						},
						{
							// transform: [
							//   {
							//     translateX: Screen.width - BUTTON_WIDTH
							//   }
							// ]
							transform: [
								{
									translateX: this._deltaX.interpolate({
										inputRange: [-Screen.width, -Screen.width / 2, -Screen.width / 2 + 5, -BUTTON_WIDTH * 2, 0],
										outputRange: [0, Screen.width / 2, Screen.width - BUTTON_WIDTH, Screen.width - BUTTON_WIDTH, Screen.width + BUTTON_WIDTH],
									// extrapolate: Animated.Extrapolate.CLAMP
									}),
								}
							]
							// transform: [
							//   {
							//     translateX: this._deltaX.interpolate({
							//       inputRange: [-155, 0],
							//       outputRange: [0, 78],
							//       // extrapolate: Animated.Extrapolate.CLAMP
							//     }),
							//   },
							// ],
						},
					]}>
					<RectButton
						style={[styles.actionButtonRightHide]}
						onPress={this.handleHideButtonPress}
					>
						<View style={styles.actionView}>
							<CustomIcon size={20} name='eye-off' color='white' />
							<Text style={styles.actionText}>{I18n.t('Hide')}</Text>
						</View>
					</RectButton>
				</Animated.View>
			</View>
		);
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	// onButtonPress(name) {
	// 	alert(`Button ${name} pressed`);
	//   }

	onSnap = ({ nativeEvent }) => {
		const { index } = nativeEvent;
		this.setState({ position: index });
	}

	onDrag = e => console.log('drag', e)

	render() {
		const {
			unread, userMentions, name, _updatedAt, alert, testID, height, type, avatarSize, baseUrl, userId, username, token, id, prid, showLastMessage, lastMessage, width
		} = this.props;
		const halfWidth = width / 2;

		const date = this.formatDate(_updatedAt);

		let accessibilityLabel = name;
		if (unread === 1) {
			accessibilityLabel += `, ${ unread } ${ I18n.t('alert') }`;
		} else if (unread > 1) {
			accessibilityLabel += `, ${ unread } ${ I18n.t('alerts') }`;
		}

		if (userMentions > 0) {
			accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
		}

		if (date) {
			accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
		}

		return (
			<View style={{ backgroundColor: '#ceced2' }}>
				{this.renderLeftActions()}
				{/* {this.renderRightActions()} */}
				<Interactable.View
					ref={el => (this.interactableElem = el)}
					horizontalOnly
					snapPoints={[
						{
							x: 78,
							damping: 1 - this.props.damping,
							tension: this.props.tension,
						},
						{
							x: 0,
							damping: 1 - this.props.damping,
							tension: this.props.tension,
						},
						{
							x: -155,
							damping: 1 - this.props.damping,
							tension: this.props.tension,
						}
					]}
					animatedValueX={this._deltaX}
					onDrag={this.onDrag}
					onSnap={this.onSnap}>
					<View style={{ left: 0, right: 0, height: 75, backgroundColor: 'white' }}>
						<RectButton
							onPress={this.onPress}
							activeOpacity={0.8}
							underlayColor='#e1e5e8'
							testID={testID}
							style={styles.button}
						>
							<View
								style={[styles.container, height && { height }]}
								accessibilityLabel={accessibilityLabel}
							>
								<Avatar text={name} size={avatarSize} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
								<View style={styles.centerContainer}>
									<View style={styles.titleContainer}>
										<TypeIcon type={type} id={id} prid={prid} />
										<Text style={[styles.title, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
										{_updatedAt ? <Text style={[styles.date, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
									</View>
									<View style={styles.row}>
										<LastMessage lastMessage={lastMessage} type={type} showLastMessage={showLastMessage} username={username} alert={alert} />
										<UnreadBadge unread={unread} userMentions={userMentions} type={type} />
									</View>
								</View>
							</View>
						</RectButton>
					</View>
				</Interactable.View>
			</View>
		);
	}
}
