import React from 'react';
import { Animated } from 'react-native';
import { LongPressGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';

import Touch from '../../utils/touch';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE } from './styles';
import { isRTL } from '../../i18n';
import { themes } from '../../lib/constants';
import { LeftActions, RightActions } from './Actions';

interface ITouchableProps {
	children: JSX.Element;
	type: string;
	onPress(): void;
	onLongPress(): void;
	testID: string;
	width: number;
	favorite: boolean;
	isRead: boolean;
	rid: string;
	toggleFav: Function;
	toggleRead: Function;
	hideChannel: Function;
	theme: string;
	isFocused: boolean;
	swipeEnabled: boolean;
	displayMode: string;
}

class Touchable extends React.Component<ITouchableProps, any> {
	private dragX: Animated.Value;

	private rowOffSet: Animated.Value;

	private reverse: Animated.Value;

	private transX: Animated.AnimatedAddition;

	private transXReverse: Animated.AnimatedMultiplication;

	private _onGestureEvent: (...args: any[]) => void;

	private _value: number;

	constructor(props: ITouchableProps) {
		super(props);
		this.dragX = new Animated.Value(0);
		this.rowOffSet = new Animated.Value(0);
		this.reverse = new Animated.Value(isRTL() ? -1 : 1);
		this.transX = Animated.add(this.rowOffSet, this.dragX);
		this.transXReverse = Animated.multiply(this.transX, this.reverse);
		this.state = {
			rowState: 0 // 0: closed, 1: right opened, -1: left opened
		};
		this._onGestureEvent = Animated.event([{ nativeEvent: { translationX: this.dragX } }], { useNativeDriver: true });
		this._value = 0;
	}

	_onHandlerStateChange = ({ nativeEvent }: any) => {
		if (nativeEvent.oldState === State.ACTIVE) {
			this._handleRelease(nativeEvent);
		}
	};

	onLongPressHandlerStateChange = ({ nativeEvent }: any) => {
		if (nativeEvent.state === State.ACTIVE) {
			this.onLongPress();
		}
	};

	_handleRelease = (nativeEvent: any) => {
		const { translationX } = nativeEvent;
		const { rowState } = this.state;
		this._value += translationX;

		let toValue = 0;
		if (rowState === 0) {
			// if no option is opened
			if (translationX > 0 && translationX < LONG_SWIPE) {
				// open leading option if he swipe right but not enough to trigger action
				if (isRTL()) {
					toValue = 2 * ACTION_WIDTH;
				} else {
					toValue = ACTION_WIDTH;
				}
				this.setState({ rowState: -1 });
			} else if (translationX >= LONG_SWIPE) {
				toValue = 0;
				if (isRTL()) {
					this.hideChannel();
				} else {
					this.toggleRead();
				}
			} else if (translationX < 0 && translationX > -LONG_SWIPE) {
				// open trailing option if he swipe left
				if (isRTL()) {
					toValue = -ACTION_WIDTH;
				} else {
					toValue = -2 * ACTION_WIDTH;
				}
				this.setState({ rowState: 1 });
			} else if (translationX <= -LONG_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
				if (isRTL()) {
					this.toggleRead();
				} else {
					this.hideChannel();
				}
			} else {
				toValue = 0;
			}
		}

		if (rowState === -1) {
			// if left option is opened
			if (this._value < SMALL_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
			} else if (this._value > LONG_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
				if (isRTL()) {
					this.hideChannel();
				} else {
					this.toggleRead();
				}
			} else if (isRTL()) {
				toValue = 2 * ACTION_WIDTH;
			} else {
				toValue = ACTION_WIDTH;
			}
		}

		if (rowState === 1) {
			// if right option is opened
			if (this._value > -2 * SMALL_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
			} else if (this._value < -LONG_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
				if (isRTL()) {
					this.toggleRead();
				} else {
					this.hideChannel();
				}
			} else if (isRTL()) {
				toValue = -ACTION_WIDTH;
			} else {
				toValue = -2 * ACTION_WIDTH;
			}
		}
		this._animateRow(toValue);
	};

	_animateRow = (toValue: any) => {
		this.rowOffSet.setValue(this._value);
		this._value = toValue;
		this.dragX.setValue(0);
		Animated.spring(this.rowOffSet, {
			toValue,
			bounciness: 0,
			useNativeDriver: true
		}).start();
	};

	close = () => {
		this.setState({ rowState: 0 });
		this._animateRow(0);
	};

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

	onLongPress = () => {
		const { rowState } = this.state;
		const { onLongPress } = this.props;
		if (rowState !== 0) {
			this.close();
			return;
		}

		if (onLongPress) {
			onLongPress();
		}
	};

	render() {
		const { testID, isRead, width, favorite, children, theme, isFocused, swipeEnabled, displayMode } = this.props;

		return (
			<LongPressGestureHandler onHandlerStateChange={this.onLongPressHandlerStateChange}>
				<Animated.View>
					<PanGestureHandler
						minDeltaX={20}
						onGestureEvent={this._onGestureEvent}
						onHandlerStateChange={this._onHandlerStateChange}
						enabled={swipeEnabled}>
						<Animated.View>
							<LeftActions
								transX={this.transXReverse}
								isRead={isRead}
								width={width}
								onToggleReadPress={this.onToggleReadPress}
								theme={theme}
								displayMode={displayMode}
							/>
							<RightActions
								transX={this.transXReverse}
								favorite={favorite}
								width={width}
								toggleFav={this.toggleFav}
								onHidePress={this.onHidePress}
								theme={theme}
								displayMode={displayMode}
							/>
							<Animated.View
								style={{
									transform: [{ translateX: this.transX }]
								}}>
								<Touch
									onPress={this.onPress}
									theme={theme}
									testID={testID}
									style={{
										backgroundColor: isFocused ? themes[theme].chatComponentBackground : themes[theme].backgroundColor
									}}>
									{children}
								</Touch>
							</Animated.View>
						</Animated.View>
					</PanGestureHandler>
				</Animated.View>
			</LongPressGestureHandler>
		);
	}
}

export default Touchable;
