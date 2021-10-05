import React from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, FlatList, TouchableWithoutFeedback } from 'react-native';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import { headerHeight } from '../../../containers/Header';
import * as List from '../../../containers/List';
import DropdownItemFilter from './DropdownItemFilter';
import DropdownItemHeader from './DropdownItemHeader';
import { ROW_HEIGHT } from './DropdownItem';

const ANIMATION_DURATION = 200;

class Dropdown extends React.Component {
	static propTypes = {
		isMasterDetail: PropTypes.bool,
		theme: PropTypes.string,
		insets: PropTypes.object,
		currentDepartment: PropTypes.object,
		onClose: PropTypes.func,
		onDepartmentSelected: PropTypes.func,
		departments: PropTypes.array
	};

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(this.animatedValue, {
			toValue: 1,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start();
	}

	close = () => {
		const { onClose } = this.props;
		Animated.timing(this.animatedValue, {
			toValue: 0,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start(() => onClose());
	};

	render() {
		const { isMasterDetail, insets, theme, currentDepartment, onDepartmentSelected, departments } = this.props;
		const statusBarHeight = insets?.top ?? 0;
		const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-300, heightDestination] // approximated height of the component when closed/open
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity]
		});

		const maxRows = 5;
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View
						style={[
							styles.backdrop,
							{
								backgroundColor: themes[theme].backdropColor,
								opacity: backdropOpacity,
								top: heightDestination
							}
						]}
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
					]}>
					<DropdownItemHeader department={currentDepartment} onPress={this.close} />
					<List.Separator />
					<FlatList
						style={{ maxHeight: maxRows * ROW_HEIGHT }}
						data={departments}
						keyExtractor={item => item._id}
						renderItem={({ item }) => (
							<DropdownItemFilter onPress={onDepartmentSelected} currentDepartment={currentDepartment} value={item} />
						)}
						keyboardShouldPersistTaps='always'
					/>
				</Animated.View>
			</>
		);
	}
}

export default withTheme(withSafeAreaInsets(Dropdown));
