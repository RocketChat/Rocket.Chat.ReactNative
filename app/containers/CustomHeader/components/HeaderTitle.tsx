import React from 'react';
import {
  Text,
  TextStyle,
  StyleProp
} from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';

import { MarkdownPreview } from '../../markdown';
import styles from '../styles';

interface IHeaderTitle {
  title: string;
  tmid?: string;
  prid?: string;
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const HeaderTitle = ({
  title,
  tmid,
  prid,
  onPress,
  testID,
  style,
  numberOfLines = 1
}: IHeaderTitle) => {
  // Filter out falsy values and ensure type is TextStyle[]
  const mergedStyleArray: TextStyle[] = [styles.title, style]
    .flat()
    .filter((s): s is TextStyle => !!s);

  const inner =
    tmid || prid ? (
      <MarkdownPreview msg={title} style={mergedStyleArray} testID={testID} />
    ) : (
      <Text
        style={[styles.title, style]}
        numberOfLines={numberOfLines}
        testID={testID}
      >
        {title}
      </Text>
    );

  if (onPress) {
    return (
      <PlatformPressable onPress={onPress} testID={testID}>
        {inner}
      </PlatformPressable>
    );
  }

  return inner;
};

export default HeaderTitle;
