import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import ScrollableTabView, { ScrollableTabBar } from 'react-native-scrollable-tab-view';

import * as HeaderButton from '../../containers/HeaderButton';
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
	route: RouteProp<{ ReactionsView: { params: any; reactions: any; showCloseModal: boolean } }, 'ReactionsView'>;
}

interface IReactionsLabelProps {
	reactions: any;
	baseUrl: string;
	getCustomEmoji: Function;
	name: string;
	page: number;
	theme: string;
}

const TabLabel = React.memo(({ name, baseUrl, getCustomEmoji, reactions, page, theme }: IReactionsLabelProps) => (
	<View style={sharedStyles.tabView}>
		<Emoji
			content={name}
			standardEmojiStyle={sharedStyles.reactionEmoji}
			customEmojiStyle={sharedStyles.reactionCustomEmoji}
			baseUrl={baseUrl}
			getCustomEmoji={getCustomEmoji}
		/>
		<Text
			style={{
				...sharedStyles.textBold,
				color: themes[theme].bodyText
			}}>
			{reactions[page]?.usernames?.length}
		</Text>
	</View>
));

class ReactionsView extends React.PureComponent<IReactionsViewProps> {
	constructor(props: IReactionsViewProps) {
		super(props);
	}

	componentDidMount() {
		this.setHeader();
	}

	getCustomEmoji = (name: string) => {
		const emoji = this.props.customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	setHeader = () => {
		const { navigation, route } = this.props;
		const showCloseModal = route.params?.showCloseModal;
		navigation.setOptions({
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} /> : undefined,
			title: I18n.t('Reactions')
		});
	};

	renderTab = (name: string, pageIndex: number, isTabActive: boolean, onPressHandler: Function) => {
		const { theme, route, baseUrl } = this.props;
		const reactions = route.params?.reactions || route.params?.params?.reactions || [];
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				testID={isTabActive ? `reaction-tab-${name}-active` : `reaction-tab-${name}`}
				key={`${name}`}
				onPress={() => onPressHandler(pageIndex)}>
				<TabLabel
					getCustomEmoji={this.getCustomEmoji}
					reactions={reactions}
					baseUrl={baseUrl}
					name={name}
					page={pageIndex}
					theme={theme}
				/>
				{isTabActive ? (
					<View style={[sharedStyles.activeTabLine, { backgroundColor: themes[theme!].tintColor }]} />
				) : (
					<View style={sharedStyles.tabLine} />
				)}
			</TouchableOpacity>
		);
	};

	render = () => {
		const { theme, route } = this.props;
		const reactions = route.params?.params?.reactions || route.params?.reactions || [];

		return (
			<View style={[sharedStyles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<SafeAreaView testID='reactions-view'>
					<ScrollableTabView
						contentProps={{
							keyboardShouldPersistTaps: 'always',
							keyboardDismissMode: 'none'
						}}
						renderTabBar={() => (
							<ScrollableTabBar
								underlineStyle={{ backgroundColor: themes[theme].auxiliaryTintColor }}
								style={{ ...sharedStyles.tabsContainer, backgroundColor: themes[theme].headerBackground }}
								tabsContainerStyle={sharedStyles.tabsContainer}
								renderTab={this.renderTab}
							/>
						)}
						style={{ backgroundColor: themes[theme].backgroundColor }}>
						{reactions.map((reaction: any) => (
							<TabPage tabLabel={reaction.emoji} reaction={reaction} key={reaction.emoji} theme={theme} />
						))}
					</ScrollableTabView>
				</SafeAreaView>
			</View>
		);
	};
}

const mapStateToProps = (state: any) => ({
	baseUrl: state.server.server,
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(withTheme(withDimensions(withSafeAreaInsets(ReactionsView))));
