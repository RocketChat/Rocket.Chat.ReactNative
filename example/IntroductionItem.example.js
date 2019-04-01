import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Introducitonitem from "../src/base/components/introductionItem/IntroductionItem";

export default class Test extends React.Component {
  render() {
    const IntroducitonItemProps = {
      avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
      name: "reactreara",
      mainTitle: "xiao麦麦",
      info:
        "nice girlice girlice girlice girlice girlice girlice girlice girlice girlice girlice girlice girlice girlice girlice girl",
      detailImages: [
        "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
        "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
        "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
        "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
        "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
        "https://img3.doubanio.com/img/fmadmin/large/31905.jpg"
      ],
      bottomInfo: "hahaha"
    };
    return (
      <View style={styles.container}>
        <Text>Introducitonitem show bellow.</Text>
        <Introducitonitem
          introImageStyle={{ width: 40, height: 40 }}
          {...IntroducitonItemProps}
          onAvatarPress={props => {
            console.log("onAvatarPress" + props.name);
          }}
          onItemPress={props => {
            console.log("onItemPress" + props.mainTitle);
          }}
          onDetailImagesPress={props => {
            console.log("onDetailImagesPress" + props.detailImages);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
