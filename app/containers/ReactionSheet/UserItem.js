import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import styles from './styles';
import Avatar from '../Avatar';

export const UserItem = React.memo(({ user, getCustomEmoji, baseUrl, theme, userId, userToken }) => {
  const IMG_SIZE = 45;
  return (
    <View
      style={{
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <Avatar
        style={{marginRight: 20}}
        text={user}
        size={IMG_SIZE}
        borderRadius={IMG_SIZE}
        onPress={() => {}}
        getCustomEmoji={getCustomEmoji}
        baseUrl={baseUrl}
        userId={userId}
        token={userToken}
        theme={theme}
      />
      <Text>{user}</Text>
    </View>
  )
});

UserItem.propTypes = {
  user: PropTypes.string,
  getCustomEmoji: PropTypes.func,
  baseUrl: PropTypes.string,
  theme: PropTypes.string,
  userId: PropTypes.string,
  userToken: PropTypes.string
};