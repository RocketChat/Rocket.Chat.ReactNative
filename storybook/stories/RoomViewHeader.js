import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { HeaderBackButton } from 'react-navigation-stack';

import HeaderComponent from '../../app/views/RoomView/Header/Header';
// import { CustomHeaderButtons, Item } from '../../app/containers/HeaderButton';
import StoriesSeparator from './StoriesSeparator';
import { isIOS } from '../../app/utils/deviceInfo';
import { themes } from '../../app/constants/colors';

let _theme = 'light';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		height: isIOS ? 44 : 56,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		marginVertical: 6
	}
});

const Header = props => (
	<View style={[styles.container, { backgroundColor: themes[_theme].headerBackground }]}>
		<HeaderBackButton />
		<HeaderComponent
			title='test'
			type='d'
			width={375}
			height={480}
			theme={_theme}
			{...props}
		/>
		{/* not working because we use withTheme */}
		{/* <CustomHeaderButtons>
			<Item title='thread' iconName='thread' />
		</CustomHeaderButtons>
		<CustomHeaderButtons>
			<Item title='more' iconName='menu' />
		</CustomHeaderButtons> */}
	</View>
);

// eslint-disable-next-line react/prop-types
export default ({ theme }) => {
	_theme = theme;
	return (
		<ScrollView style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
			<StoriesSeparator title='Basic' theme={theme} />
			<Header />

			<StoriesSeparator title='Types' theme={theme} />
			<Header type='d' />
			<Header type='c' />
			<Header type='p' />
			<Header type='discussion' />
			<Header type='thread' />

			<StoriesSeparator title='Typing' theme={theme} />
			<Header usersTyping={['diego.mello']} />
			<Header usersTyping={['diego.mello', 'rocket.cat']} />
			<Header usersTyping={['diego.mello', 'rocket.cat', 'detoxrn']} />

			<StoriesSeparator title='Title scroll' theme={theme} />
			<Header title='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' />
			<Header
				title='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
				usersTyping={['diego.mello', 'rocket.cat', 'detoxrn']}
			/>
		</ScrollView>
	);
};
