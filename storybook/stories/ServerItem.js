import React from 'react';
import { ScrollView } from 'react-native';

import { themes } from '../../app/constants/colors';
import ServerItemComponent from '../../app/presentation/ServerItem';
import StoriesSeparator from './StoriesSeparator';

let _theme = 'light';

const item = {
	name: 'https://open.rocket.chat/',
	id: 'gerzon.canario',
	iconURL: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};


const ServerItem = props => (
	<ServerItemComponent
		theme={_theme}
		{...props}
	/>
);

// eslint-disable-next-line react/prop-types
const Separator = ({ title }) => <StoriesSeparator title={title} theme={_theme} />;

// eslint-disable-next-line react/prop-types
export default ({ theme }) => {
	_theme = theme;
	return (
		<ScrollView style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
			<Separator title='Unchecked server' />
			<ServerItem item={item} />

			<Separator title='Checked server' />
			<ServerItem item={item} hasCheck />

			<Separator title='No icon' />
			<ServerItem item={item} />
		</ScrollView>
	);
};
