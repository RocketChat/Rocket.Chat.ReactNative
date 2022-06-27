import { storiesOf } from '@storybook/react-native';
import React from 'react';
import SearchBox from './index';

const stories = storiesOf('SearchBox', module);

stories.add('Item', () => <SearchBox />);
