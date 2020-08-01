import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import styles from './styles';
import Emoji from '../message/Emoji';
import { Button } from '../ActionSheet';

export const ReactionItem = React.memo(({ item, baseUrl, getCustomEmoji, theme, selected, setSelected }) => {
  const standardEmojiStyle = { fontSize: 30, color: 'white' };
  const customEmojiStyle = { width: 30, height: 30 };
  const selectedStyle = {
    borderBottomWidth: 5,
    borderBottomColor: 'red'
  };

  return (
    <>
      <Button
        theme={theme}
        onPress={() => setSelected(item)}
      >
        <View
          style={[{
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            marginHorizontal: 5,
          }, selected._id === item._id && selectedStyle]}>
          <View style={{ marginHorizontal: 5 }}>
            <Emoji
              content={item.emoji}
              standardEmojiStyle={standardEmojiStyle}
              customEmojiStyle={customEmojiStyle}
              baseUrl={baseUrl}
              getCustomEmoji={getCustomEmoji}
            />
          </View>
          <Text>{item.usernames.length}</Text>
        </View>
      </Button>
    </>
  )
});

ReactionItem.propTypes = {
  item: PropTypes.string,
  baseUrl: PropTypes.string,
  getCustomEmoji: PropTypes.func,
  theme: PropTypes.string,
  selected: PropTypes.object,
  setSelected: PropTypes.func
};