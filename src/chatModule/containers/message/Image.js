import PropTypes from "prop-types";
import React from "react";
import { ScrollView, Image, Dimensions } from "react-native";
import Lightbox from "react-native-lightbox";
import { CacheManager } from "react-native-expo-image-cache";

import Markdown from "./Markdown";
import styles from "./styles";

export default class extends React.PureComponent {
  static propTypes = {
    file: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
    customEmojis: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
  };

  state = { uri: null };
  remoteUri = null;

  componentWillMount() {
    const { baseUrl, file, user } = this.props;
    const img = `${baseUrl}${file.image_url}?rc_uid=${user.id}&rc_token=${
      user.token
    }`;
    this.remoteUri = encodeURI(img);
    CacheManager.get(this.remoteUri)
      .getPath()
      .then(path => {
        if (path) {
          this.setState({ uri: path });
        } else {
          this.setState({ uri: this.remoteUri });
        }
      });
  }

  componentWillUnmount() {
    if (this.remoteUri) {
      CacheManager.get(this.remoteUri).cancel();
    }
  }

  getDescription() {
    const { file, customEmojis, baseUrl, user } = this.props;
    if (file.description) {
      return (
        <Markdown
          msg={file.description}
          customEmojis={customEmojis}
          baseUrl={baseUrl}
          username={user.username}
        />
      );
    }
  }

  render() {
    const { width, height } = Dimensions.get("window");

    if (!this.state.uri) {
      return null;
    }

    return [
      <ScrollView
        key="image"
        style={styles.imageContainer}
        underlayColor="#fff"
      >
        <Lightbox
          activeProps={{
            style: [styles.image, { width, height, resizeMode: "contain" }]
          }}
        >
          <Image
            style={[styles.image, { resizeMode: "cover" }]}
            source={{ uri: this.state.uri }}
          />
        </Lightbox>
        {this.getDescription()}
      </ScrollView>
    ];
  }
}
