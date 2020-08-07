import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export default StyleSheet.create({
  separator: {
    marginHorizontal: 16
  },
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
  }
});
