import React, { PureComponent } from 'react';
import { Animated, Easing, Text, TouchableWithoutFeedback, View } from 'react-native';

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
	type: string;
}

type Method = 'default' | 'channelName' | 'userNumber' | 'userName' | 'teamName' | 'channelNumber';

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
		const { changeSelection, theme, type } = this.props;
		let text = 'Ascending';
		let icon: TIconsName = 'sort-az';
        const channelIcon: TIconsName = 'channel-public';
        const userIcon: TIconsName = 'user';

        const ascIcon: TIconsName = 'arrow-up';
        const descIcon: TIconsName = 'arrow-down';
        const defaultIcon: TIconsName = 'refresh';

		const teamIcon: TIconsName = 'team';

		switch (type){
			case "channels":
				if (method === 'channelName') {
					text = 'Channel Name';
					icon = channelIcon;
				}
				if (method === 'userNumber') {
					text = 'Number of Users';
					icon = userIcon;
				}
				if (method === 'default') {
					text = 'Default';
					icon = defaultIcon;
				}
				break;
			case "users":
				if (method === 'userName') {
					text = 'User Name';
					icon = userIcon;
				}
				if (method === 'default') {
					text = 'Default';
					icon = defaultIcon;
				}
				break;
			case "teams":
				if (method === 'teamName') {
					text = 'Team Name';
					icon = teamIcon;
				}
				if (method === 'channelNumber') {
					text = 'Number of Channels';
					icon = channelIcon;
				}
				if (method === 'default') {
					text = 'Default';
					icon = defaultIcon;
				}
				break;
		}

		console.log("selected in sortoptions", type)
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
                            <Touch onPress={() => changeSelection(type, method, "ascending")}>
                                <CustomIcon name={ascIcon} size={22} color={themes[theme].bodyText} style={styles.dropdownItemIconSort} />
                            </Touch>
                            <Touch onPress={() => changeSelection(type, method, "descending")}>
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
		const { theme, type } = this.props;
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
					{type === 'channels' && (
            <>
              {this.renderItem('channelName')}
              {this.renderItem('userNumber')}
              {this.renderItem('default')}
            </>
          )}
		  {type === 'users' && (
            <>
              {this.renderItem('userName')}
              {this.renderItem('default')}
            </>
          )}
		  {type === 'teams' && (
            <>
              {this.renderItem('teamName')}
              {this.renderItem('channelNumber')}
              {this.renderItem('default')}
            </>
          )}
				</Animated.View>
			</>
		);
	}
}