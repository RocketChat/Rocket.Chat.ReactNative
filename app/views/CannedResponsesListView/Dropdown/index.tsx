import React from 'react';
import { Animated, Easing, FlatList, TouchableWithoutFeedback } from 'react-native';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '../styles';
import { themes } from '../../../lib/constants';
import { TSupportedThemes, withTheme } from '../../../theme';
import * as List from '../../../containers/List';
import DropdownItemFilter from './DropdownItemFilter';
import DropdownItemHeader from './DropdownItemHeader';
import { ROW_HEIGHT } from './DropdownItem';
import { ILivechatDepartment } from '../../../definitions/ILivechatDepartment';

const ANIMATION_DURATION = 200;

interface IDropdownProps {
	theme?: TSupportedThemes;
	currentDepartment: ILivechatDepartment;
	onClose: () => void;
	onDepartmentSelected: (value: ILivechatDepartment) => void;
	departments: ILivechatDepartment[];
}

class Dropdown extends React.Component<IDropdownProps> {
	private animatedValue: Animated.Value;

	constructor(props: IDropdownProps) {
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
		const { theme, currentDepartment, onDepartmentSelected, departments } = this.props;
		const heightDestination = 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-300, heightDestination] // approximated height of the component when closed/open
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme!].backdropOpacity]
		});

		const maxRows = 5;
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View
						style={[
							styles.backdrop,
							{
								backgroundColor: themes[theme!].backdropColor,
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
							backgroundColor: themes[theme!].backgroundColor,
							borderColor: themes[theme!].separatorColor
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
