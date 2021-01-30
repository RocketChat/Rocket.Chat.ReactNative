import React from 'react';
import {
	View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Emoji from './message/Emoji';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from './SafeAreaView';
import Avatar from './Avatar'
const styles= StyleSheet.create({
	headerContainer: {
		marginHorizontal: 5
	},
	reactionItem: {
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		marginHorizontal: 5
	},
	reactionText: {
		...sharedStyles.textSemibold
	},
	reactionContainer: {
		marginHorizontal: 10
    },
    extendHeader: {
        height: 50,
        width: '100%'
    },
    avatar: {
        margin: 10
    }
})

const Item = React.memo(({
	item, baseUrl, getCustomEmoji, theme, selected, setSelected
}) => {
	const standardEmojiStyle = { fontSize: 20, color: 'white' };
	const customEmojiStyle = { width: 25, height: 25 };
	const selectedStyle = {
		borderBottomWidth: 2,
		borderBottomColor: themes[theme].bodyText
	};
	return (
		<>

				<TouchableOpacity
                    style={[styles.reactionItem, selected?._id === item._id && selectedStyle]}
                    onPress={()=>{setSelected(item)}}
				>
					<View style={styles.reactionContainer}>
						<Emoji
							content={item.emoji}
							standardEmojiStyle={standardEmojiStyle}
							customEmojiStyle={customEmojiStyle}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji}
						/>
					</View>
					<Text style={[styles.reactionText, { color: themes[theme].bodyText }]}>{item.usernames.length}</Text>
				</TouchableOpacity>
		</>
	);
});


const ReactionsHeader = React.memo(({
    reactions, theme,baseUrl, getCustomEmoji, selected, setSelected, ...props
}) => (
    <View>
        <FlatList
        data={reactions}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <Item item={item} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} theme={theme} selected={selected} setSelected={setSelected} />}
        keyExtractor={item => item.emoji}
        horizontal
        />
    </View>
))

const ItemNames = React.memo(({
    username, baseUrl, theme
}) => (
    <View style={{flexDirection:'row',alignItems:'center'}}>
        <View style={styles.avatar}>
        <Avatar
        text={username}
        type = 'd'
        size={40}
        baseUrl={baseUrl}
        theme={theme}
        />
        </View>
        <Text style={{color:themes[theme].bodyText, marginLeft:10}}>{username}</Text>
    </View>
))

const ReactionsNames = React.memo(({
    reactions, theme,baseUrl, getCustomEmoji, selected, setSelected, ...props
}) => (
    <View style={{ backgroundColor: themes[theme].bannerBackground }}>
        <FlatList
        data={selected.usernames}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ItemNames username={item} baseUrl={baseUrl} theme={theme} />}
        />
    </View>
))

class ReactionsModal extends React.Component{
    static navigationOptions = {
        title: 'Reactions',
      };
    state = {
        selected : this.props.route.params.message.reactions[0],
    }
    setSelected = (selectedValue) =>{
        this.setState({ selected: selectedValue })
    }
    render(){
        const {route} = this.props;
        const {message, user, theme, baseUrl, getCustomEmoji} = route.params;
        const {reactions} = message;
        return(
            <SafeAreaView style={{flex:1,backgroundColor:themes[theme].bannerBackground}}>
                <ReactionsHeader
                reactions={reactions}
                baseUrl={baseUrl}
                getCustomEmoji={getCustomEmoji}
                theme={theme}
                selected={this.state.selected}
                setSelected={this.setSelected}
                />
                <ReactionsNames
                reactions={reactions}
                selected={this.state.selected}
                baseUrl={baseUrl}
                theme={theme}
                />
            </SafeAreaView>
        )
    }
}


export default withTheme(ReactionsModal);
