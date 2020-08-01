import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
import { FlatList } from "react-native-gesture-handler";

import styles from './styles';
import { themes } from '../../constants/colors';
import { ReactionItem } from './ReactionItem';

export const Header = React.memo(({ theme, data, setSelected, selected }) => {
  return (
      <View
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: '#000',
          marginBottom: 15
        }}>
        <FlatList
          data={data.reactions}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <ReactionItem item={item} baseUrl={data.baseUrl} getCustomEmoji={data.getCustomEmoji} theme={theme} setSelected={setSelected} selected={selected} />}
          keyExtractor={item => item.emoji}
          horizontal={true}
        />
      </View>
  )
});

Header.propTypes = {
  theme: PropTypes.string,
  data: PropTypes.shape({
    reactions: PropTypes.array,
    baseUrl: PropTypes.string,
    getCustomEmoji: PropTypes.func,
    setSelected: PropTypes.func,
    selected: PropTypes.object
  })
};
