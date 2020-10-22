import React from 'react';
import PropTypes from 'prop-types';
import {
	Animated, Easing, StyleSheet, TouchableWithoutFeedback
} from 'react-native';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from './styles';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import FilterItem from './FilterItem';
import { headerHeight } from '../../containers/Header';
import Separator from '../../containers/Separator';

const ANIMATION_DURATION = 200;

class FilterDropdown extends React.Component {
	static propTypes = {
		close: PropTypes.func,
		isMasterDetail: PropTypes.bool,
		theme: PropTypes.string,
		insets: PropTypes.object

	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
		).start();
	}

	close = () => {
		const { close } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
		).start(() => close());
	}

	render() {
		// TODO: test on tablet
		const { isMasterDetail, insets, theme } = this.props;
		const statusBarHeight = insets?.top ?? 0;
		const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, heightDestination]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.3]
		});
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop,
						{
							...StyleSheet.absoluteFillObject,
							backgroundColor: themes[theme].backdropColor,
							opacity: backdropOpacity,
							top: heightDestination
						}]}
					/>
				</TouchableWithoutFeedback>
				<Animated.View
					style={[
						styles.dropdownContainer,
						{
							transform: [{ translateY }],
							backgroundColor: themes[theme].backgroundColor,
							borderColor: themes[theme].separatorColor
						}
					]}
				>
					<FilterItem text='Displaying Following' iconName='filter' onPress={this.close} />
					<Separator />
					<FilterItem text='All' iconName='check' />
					<FilterItem text='Following' />
					<FilterItem text='Unread' />
				</Animated.View>
			</>
		);
	}
}

export default withTheme(withSafeAreaInsets(FilterDropdown));
