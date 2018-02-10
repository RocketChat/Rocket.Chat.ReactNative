/* eslint-disable */

import SafariView from 'react-native-safari-view';

const openLink = (url: string) => SafariView.isAvailable()
  .then(SafariView.show({
      url: url,
      readerMode: true,
      fromBottom: true,
      tintColor: 'rgb(0, 0, 0)'
    }));

export default openLink;
