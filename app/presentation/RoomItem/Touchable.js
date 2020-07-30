import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import Touch from '../../utils/touch';
import {
	ACTION_WIDTH,
	SMALL_SWIPE,
	LONG_SWIPE
} from './styles';
import { themes } from '../../constants/colors';
import { LeftActions, RightActions } from './Actions';

class Touchable extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		onPress: PropTypes.func,
		testID: PropTypes.string,
		width: PropTypes.number,
		favorite: PropTypes.bool,
		isRead: PropTypes.bool,
		rid: PropTypes.string,
		toggleFav: PropTypes.func,
		toggleRead: PropTypes.func,
		hideChannel: PropTypes.func,
		children: PropTypes.element,
		theme: PropTypes.string,
		isFocused: PropTypes.bool,
		swipeEnabled: PropTypes.bool
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
		}


		_handleRelease = (nativeEvent) => {
			const { translationX } = nativeEvent;
			const { rowState } = this.state;
			this._value += translationX;

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
				testID, isRead, width, favorite, children, theme, isFocused, swipeEnabled
			} = this.props;

			return (

				<PanGestureHandler
					minDeltaX={20}
					onGestureEvent={this._onGestureEvent}
					onHandlerStateChange={this._onHandlerStateChange}
					enabled={swipeEnabled}
				>
					<Animated.View>
						<LeftActions
							transX={this.transX}
							isRead={isRead}
							width={width}
							onToggleReadPress={this.onToggleReadPress}
							theme={theme}
						/>
						<RightActions
							transX={this.transX}
							favorite={favorite}
							width={width}
							toggleFav={this.toggleFav}
							onHidePress={this.onHidePress}
							theme={theme}
						/>
						<Animated.View
							style={{
								transform: [{ translateX: this.transX }]
							}}
						>
							<Touch
								onPress={this.onPress}
								theme={theme}
								testID={testID}
								style={{
									backgroundColor: isFocused ? themes[theme].chatComponentBackground : themes[theme].backgroundColor
								}}
							>
								{children}
							</Touch>
						</Animated.View>
					</Animated.View>

				</PanGestureHandler>
			);
		}
}

export default Touchable;
