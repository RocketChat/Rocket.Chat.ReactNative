import React from 'react';
// @ts-ignore
import { View, Text, TouchableOpacity } from 'react-native';

import { connect } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import ScrollableTabView, { ScrollableTabBar } from 'react-native-scrollable-tab-view';

import I18n from '../../i18n';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { withDimensions } from '../../dimensions';
import SafeAreaView from '../../containers/SafeAreaView';
import Emoji from '../../containers/message/Emoji';

import sharedStyles from './styles';
import TabPage from './TabPage';

interface IReactionsViewProps {
	navigation: StackNavigationProp<any, 'ReactionsView'>;
	theme: string;
	baseUrl: string;
	customEmojis: any;
	route: RouteProp<{ ReactionsView : { reactions: any } }, 'ReactionsView'>;
}

interface IReactionsLabelProps {
	reactions: any;
	baseUrl: string;
	getCustomEmoji: Function;
	name: string;
	page: number;
	theme: string;
}

class TabLabel extends React.PureComponent<IReactionsLabelProps> {
	constructor(props: IReactionsLabelProps) {
		super(props);
	}

	render = () => {
		const { name, baseUrl, getCustomEmoji, reactions, page, theme } = this.props;

		return (
			<View style={sharedStyles.tabView}>
				<Emoji
					content={name}
					standardEmojiStyle={sharedStyles.reactionEmoji}
					customEmojiStyle={sharedStyles.reactionCustomEmoji}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
				></Emoji>
				<Text style={{...sharedStyles.textBold, color: themes[theme].bodyText }}>
					{reactions[page].usernames.length}
				</Text>
			</View>
		);
	}
}

class ReactionsView extends React.PureComponent<IReactionsViewProps> {
	constructor(props: IReactionsViewProps) {
		super(props);
		props.navigation.setOptions({ title: I18n.t('Reactions') });
	}

	getCustomEmoji = (name: string) => {
		const emoji = this.props.customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	renderTab = (
		name: string, pageIndex: number, isTabActive: boolean, onPressHandler: Function
	) => {
		const { theme, route, baseUrl } = this.props;
		const reactions = route.params?.reactions || [];
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				testID={isTabActive ? `reaction-tab-${ name }-active` : `reaction-tab-${ name }`}
				key={`${ name }`}
				onPress={() => onPressHandler(pageIndex)}
			>
				<TabLabel getCustomEmoji={this.getCustomEmoji} reactions={reactions} baseUrl={baseUrl} name={name} page={pageIndex} theme={theme} />
			</TouchableOpacity>
		);
	}

	render = () => {
		const { theme, route, baseUrl } = this.props;
		const reactions = route.params?.reactions || [];

		return (
			<View style={[sharedStyles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<SafeAreaView testID='reactions-view'>
					<ScrollableTabView
						renderTabBar={() => <ScrollableTabBar underlineStyle={{ backgroundColor: themes[theme].auxiliaryTintColor }} style={{...sharedStyles.tabsContainer, backgroundColor: themes[theme].headerBackground }} tabsContainerStyle={sharedStyles.tabsContainer} renderTab={this.renderTab} />}
						style={{ backgroundColor: themes[theme].backgroundColor }}
					>
						{
							reactions.map((reaction : any) => <TabPage reaction={reaction} key={reaction.emoji} theme={theme} />)
						}
					</ScrollableTabView>
				</SafeAreaView>
			</View>
		);
	}
}

const mapStateToProps = (state: any) => ({
	baseUrl: state.server.server,
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(withTheme(withDimensions(withSafeAreaInsets(ReactionsView))));