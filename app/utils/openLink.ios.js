import { Linking } from 'react-native';
import SafariView from "react-native-safari-view";

const openLink = (url: string) => SafariView.isAvailable()
      .then(SafariView.show({
        url: url,
        readerMode: true,
        fromBottom: true,
        tintColor: "rgb(0, 0, 0)",
      }))
      .catch(error => {
        Linking.openURL(url);
      });

export default openLink;
