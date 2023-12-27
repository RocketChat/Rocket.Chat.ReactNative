import React, { PureComponent } from 'react';
import { Animated, Easing, Text, TouchableWithoutFeedback, View } from 'react-native';

import Check from '../../containers/Check';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import Touch from '../../containers/Touch';
import I18n from '../../i18n';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';
import styles from './styles';

const ANIMATION_DURATION = 200;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};

interface IDirectoryOptionsProps {
	theme: TSupportedThemes;
	close: Function;
	selected: string;
	changeSelection: Function;
}

type Method = "default" | "channel" | "user";

export default class SortOptions extends PureComponent<IDirectoryOptionsProps, any> {
	private animatedValue: Animated.Value;

	constructor(props: IDirectoryOptionsProps) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(this.animatedValue, {
			toValue: 1,
			...ANIMATION_PROPS
		}).start();
	}

	close = () => {
		const { close } = this.props;
		Animated.timing(this.animatedValue, {
			toValue: 0,
			...ANIMATION_PROPS
		}).start(() => close());
	};

	renderItem = (method: Method) => {
		const { changeSelection, selected, theme } = this.props;
		let text = 'Ascending';
		let icon: TIconsName = 'sort-az';
        let channelIcon: TIconsName = 'channel-public';
        let userIcon: TIconsName = 'user';

        let ascIcon: TIconsName = 'arrow-up';
        let descIcon: TIconsName = 'arrow-down';
        let defaultIcon: TIconsName = 'refresh';

		if (method === 'channel') {
			text = 'Channel';
			icon = channelIcon;
		}
		if (method === 'user') {
			text = 'User';
			icon = userIcon;
		}
		if (method === 'default') {
			text = 'Default';
			icon = defaultIcon;
		}

        return (
            <View style={styles.dropdownItemButton}>
                <View style={styles.dropdownItemContainer}>
                    {method === "default" ? (
                        
                        <Touch style={styles.dropdownItemContainerSort} onPress={() => changeSelection(method, "default")}>
                            <View style={styles.dropdownItemContainer}>
                                <CustomIcon name={icon} size={22} color={themes[theme].bodyText} style={styles.dropdownItemIcon} />
                                <Text style={[styles.dropdownItemText, { color: themes[theme].bodyText }]}>{I18n.t(text)}</Text>
                            </View>
                        </Touch>
                    ) : (
                        <View style={styles.dropdownItemContainer}>
                            <CustomIcon name={icon} size={22} color={themes[theme].bodyText} style={styles.dropdownItemIcon} />
                            <Text style={[styles.dropdownItemText, { color: themes[theme].bodyText }]}>{I18n.t(text)}</Text>
                        </View>
                    )}
        
                    {method !== "default" && (
                        <>
                            <Touch onPress={() => changeSelection(method, "ascending")}>
                                <CustomIcon name={ascIcon} size={22} color={themes[theme].bodyText} style={styles.dropdownItemIconSort} />
                            </Touch>
                            <Touch onPress={() => changeSelection(method, "descending")}>
                                <CustomIcon name={descIcon} size={22} color={themes[theme].bodyText} style={styles.dropdownItemIconSort} />
                            </Touch>
                        </>
                    )}
                </View>
            </View>
        );
        
        
	};

	render() {
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, 0]
		});
		const { theme } = this.props;
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity]
		});
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor, opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View
					style={[styles.dropdownContainer, { transform: [{ translateY }], backgroundColor: themes[theme].backgroundColor }]}
				>
					<Touch onPress={this.close} accessibilityLabel={I18n.t('Sort_by')}>
						<View
							style={[
								styles.dropdownContainerHeader,
								styles.dropdownItemContainer,
								{ borderColor: themes[theme].separatorColor }
							]}
						>
							<Text style={[styles.dropdownToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Sort_by')}</Text>
							<CustomIcon
								style={[styles.dropdownItemIcon, styles.inverted]}
								size={22}
								name='chevron-down'
								color={themes[theme].auxiliaryTintColor}
							/>
						</View>
					</Touch>
					{this.renderItem('channel')}
					{this.renderItem('user')}
					{this.renderItem('default')}
				</Animated.View>
			</>
		);
	}
}