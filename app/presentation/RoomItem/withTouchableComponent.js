/* eslint-disable no-mixed-spaces-and-tabs */

import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';
import {
	RectButton,
	PanGestureHandler,
	State
} from 'react-native-gesture-handler';
import styles, {
	ACTION_WIDTH,
	SMALL_SWIPE,
	LONG_SWIPE
} from './styles';
import { LeftActions, RightActions } from './Actions';

const withTouchableComponent = (WrappedComponent) => {
	class Test extends React.Component {
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
        	// eslint-disable-next-line no-mixed-spaces-and-tabs
        	onPress: PropTypes.func,
        	userId: PropTypes.string,
        	username: PropTypes.string,
        	token: PropTypes.string,
        	avatarSize: PropTypes.number,
        	testID: PropTypes.string,
        	width: PropTypes.number,
        	favorite: PropTypes.bool,
        	isRead: PropTypes.bool,
        	rid: PropTypes.string,
        	status: PropTypes.string,
        	toggleFav: PropTypes.func,
        	toggleRead: PropTypes.func,
        	hideChannel: PropTypes.func,
        	avatar: PropTypes.bool
        }

        constructor(props) {
        	super(props);
        	this.dragX = new Animated.Value(0);
        	this.rowOffSet = new Animated.Value(0);
        	this.transX = Animated.add(
        		this.rowOffSet,
        		this.dragX
        	);
        	this.state = {
        		rowState: 0 // 0: closed, 1: right opened, -1: left opened
        	};
        	this._onGestureEvent = Animated.event(
        		[{ nativeEvent: { translationX: this.dragX } }]
        	);
        	this._value = 0;
        }

        _onHandlerStateChange = ({ nativeEvent }) => {
 			if (nativeEvent.oldState === State.ACTIVE) {
				 this._handleRelease(nativeEvent);
        	}
        };

		_handleRelease = (nativeEvent) => {
			const { translationX } = nativeEvent;
			const { rowState } = this.state;
			this._value = this._value + translationX;

			let toValue = 0;
			if (rowState === 0) { // if no option is opened
				if (translationX > 0 && translationX < LONG_SWIPE) {
					toValue = ACTION_WIDTH; // open left option if he swipe right but not enough to trigger action
					this.setState({ rowState: -1 });
				} else if (translationX >= LONG_SWIPE) {
					toValue = 0;
					this.toggleRead();
				} else if (translationX < 0 && translationX > -LONG_SWIPE) {
					toValue = -2 * ACTION_WIDTH; // open right option if he swipe left
					this.setState({ rowState: 1 });
				} else if (translationX <= -LONG_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
					this.hideChannel();
				} else {
					toValue = 0;
				}
			}

			if (rowState === -1) { // if left option is opened
				if (this._value < SMALL_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
				} else if (this._value > LONG_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
					this.toggleRead();
				} else {
					toValue = ACTION_WIDTH;
				}
			}

			if (rowState === 1) { // if right option is opened
				if (this._value > -2 * SMALL_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
				} else if (this._value < -LONG_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
					this.hideChannel();
				} else {
					toValue = -2 * ACTION_WIDTH;
				}
			}
			this._animateRow(toValue);
		}

		_animateRow = (toValue) => {
			this.rowOffSet.setValue(this._value);
			this._value = toValue;
			this.dragX.setValue(0);
			Animated.spring(this.rowOffSet, {
				toValue,
				bounciness: 0,
				useNativeDriver: true
			}).start();
		}

		close = () => {
			this.setState({ rowState: 0 });
			this._animateRow(0);
		}

		toggleFav = () => {
			const { toggleFav, rid, favorite } = this.props;
			if (toggleFav) {
				toggleFav(rid, favorite);
			}
			this.close();
		};

		toggleRead = () => {
			const { toggleRead, rid, isRead } = this.props;
			if (toggleRead) {
				toggleRead(rid, isRead);
			}
		};

		hideChannel = () => {
			const { hideChannel, rid, type } = this.props;
			if (hideChannel) {
				hideChannel(rid, type);
			}
		};

		onToggleReadPress = () => {
			this.toggleRead();
			this.close();
		};

		onHidePress = () => {
			this.hideChannel();
			this.close();
		};

		onPress = () => {
			const { rowState } = this.state;
			if (rowState !== 0) {
				this.close();
				return;
			}
			const { onPress } = this.props;
			if (onPress) {
				onPress();
			}
		};

		render() {
			const {
				// eslint-disable-next-line no-unused-vars
				testID, isRead, width, favorite
			} = this.props;

			return (

				<PanGestureHandler
					minDeltaX={20}
					onGestureEvent={this._onGestureEvent}
					onHandlerStateChange={this._onHandlerStateChange}
				>
					<Animated.View>
						<LeftActions
							transX={this.transX}
							isRead={isRead}
							width={width}
							onToggleReadPress={this.onToggleReadPress}
						/>
						<RightActions
							transX={this.transX}
							favorite={favorite}
							width={width}
							toggleFav={this.toggleFav}
							onHidePress={this.onHidePress}
						/>
						<Animated.View
							style={{
								transform: [{ translateX: this.transX }]
							}}
						>
							<RectButton
								onPress={this.onPress}
								activeOpacity={0.8}
								underlayColor='#e1e5e8'
								testID={testID}
								style={styles.button}
							>
								<WrappedComponent {...this.props} />
							</RectButton>
						</Animated.View>
					</Animated.View>

				</PanGestureHandler>
			);
		}
	}

	return Test;
};

export default withTouchableComponent;
