/* eslint-disable react/prop-types */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Markdown from '../../app/containers/markdown';
import StoriesSeparator from './StoriesSeparator';
import { themes } from '../../app/constants/colors';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15
	},
	separator: {
		marginHorizontal: 10,
		marginVertical: 10
	}
});

// eslint-disable-next-line arrow-body-style
export default ({ theme }) => {
	return (
		<ScrollView style={{ backgroundColor: themes[theme].auxiliaryBackground, marginVertical: 10, marginBottom: 50 }}>

			<StoriesSeparator style={styles.separator} title='Headers' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='# Header 1'
					theme={theme}
				/>
				<Markdown
					msg='## Header 2'
					theme={theme}
				/>
				<Markdown
					msg='### Header 3'
					theme={theme}
				/>
				<Markdown
					msg='#### Header 4'
					theme={theme}
				/>
				<Markdown
					msg='##### Header 5'
					theme={theme}
				/>
				<Markdown
					msg='###### Header 6'
					theme={theme}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Short Text' theme={theme} />
			<View style={styles.container}>
				<Markdown msg='This is Rocket.Chat' theme={theme} />
			</View>

			<StoriesSeparator style={styles.separator} title='Long Text' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
					theme={theme}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Edited' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='This is Edited'
					theme={theme}
					isEdited
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Reply' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='This is a reply This is a reply This is Reply This is Reply'
					theme={theme}
					numberOfLines={1}
					preview
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Short Link' theme={theme} />
			<View style={styles.container}>
				<Markdown msg='https://www.google.com' theme={theme} />
			</View>

			<StoriesSeparator style={styles.separator} title='Long Link' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='https://www.google.com/search?q=ROcket+Chat&sxsrf=ALeKk02yM3p0-CkP_xQX7VHTya90UAKgig:1583174106589&source=lnms&tbm=isch&sa=X&ved=2ahUKEwj0ovaRt_znAhVdwTgGHfI3DOQQ_AUoAnoECA0QBA&biw=1920&bih=942#imgrc=oTPvGoNKD8TDpM'
					theme={theme}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Text as Link' theme={theme} />
			<View style={styles.container}>
				<Markdown msg='[This is a link](https://www.google.com)' theme={theme} />
			</View>

			<StoriesSeparator style={styles.separator} title='Mentions' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='@sarthak'
					theme={theme}
					mentions={[{ _id: 'random', name: 'Sarthak', username: 'sarthak' }]}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Multiple Mentions with Text' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='@sarthak @name1 Testing'
					theme={theme}
					mentions={[{ _id: 'random', name: 'Sarthak', username: 'sarthak' }, { _id: 'random2', name: 'Name', username: 'name1' }]}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Hashtag' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='#testChannel'
					theme={theme}
					channels={[{ _id: 'TESTCHANNEL', name: 'testChannel' }]}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Emoji' theme={theme} />
			<View style={styles.container}>
				<Markdown msg='😃😇👍' theme={theme} />
				<Markdown msg='🚀🚀🚀' theme={theme} />
			</View>

			<StoriesSeparator style={styles.separator} title='Block Quote' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='> This is Block Quote'
					theme={theme}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Code in line' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='Normal inline code - `CodeInLine`'
					theme={theme}
					channels={[{ _id: 'TESTCHANNEL', name: 'testChannel' }]}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Code Block' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg={'```javascript\nvar s = "JavaScript syntax highlighting";\nalert(s);\n```'}
					theme={theme}
					channels={[{ _id: 'TESTCHANNEL', name: 'testChannel' }]}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Lists' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg={'* Open Source\n* Rocket.Chat\n  - nodejs\n  - ReactNative'}
					theme={theme}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Numbered Lists' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg={'1. Open Source\n2. Rocket.Chat'}
					theme={theme}
				/>
			</View>

			<StoriesSeparator style={styles.separator} title='Emphasis' theme={theme} />
			<View style={styles.container}>
				<Markdown
					msg='Strong emphasis, aka bold, with **asterisks** or __underscores__'
					theme={theme}
					channels={[{ _id: 'TESTCHANNEL', name: 'testChannel' }]}
				/>
			</View>

		</ScrollView>
	);
};
