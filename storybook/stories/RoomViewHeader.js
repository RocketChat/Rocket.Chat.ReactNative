import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { HeaderBackButton } from 'react-navigation';

import HeaderComponent from '../../app/views/RoomView/Header/Header';
import { CustomHeaderButtons, Item } from '../../app/containers/HeaderButton';
import { COLOR_SEPARATOR, HEADER_BACKGROUND } from '../../app/constants/colors';
import StoriesSeparator from './StoriesSeparator';
import { isIOS } from '../../app/utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		height: isIOS ? 44 : 56,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: COLOR_SEPARATOR,
		marginVertical: 6,
		backgroundColor: HEADER_BACKGROUND
	}
});

const Header = props => (
	<View style={styles.container}>
		<HeaderBackButton />
		<HeaderComponent
			title='test'
			type='d'
			width={375}
			height={480}
			{...props}
		/>
		<CustomHeaderButtons>
			<Item title='thread' iconName='thread' />
		</CustomHeaderButtons>
		<CustomHeaderButtons>
			<Item title='more' iconName='menu' />
		</CustomHeaderButtons>
	</View>
);

export default (
	<ScrollView>
		<StoriesSeparator title='Basic' />
		<Header />

		<StoriesSeparator title='Types' />
		<Header type='d' />
		<Header type='c' />
		<Header type='p' />
		<Header type='discussion' />
		<Header type='thread' />

		<StoriesSeparator title='Typing' />
		<Header usersTyping={[{ username: 'diego.mello' }]} />
		<Header usersTyping={[{ username: 'diego.mello' }, { username: 'rocket.cat' }]} />
		<Header usersTyping={[{ username: 'diego.mello' }, { username: 'rocket.cat' }, { username: 'detoxrn' }]} />

		<StoriesSeparator title='Title scroll' />
		<Header title='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' />
		<Header
			title='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
			usersTyping={[{ username: 'diego.mello' }, { username: 'rocket.cat' }, { username: 'detoxrn' }]}
		/>
	</ScrollView>
);
