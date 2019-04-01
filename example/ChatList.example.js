import React from "react";
import { View, Dimensions } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";

import Rooms from "../src/chatModule/chatList/components/Rooms";

export default class Test extends React.Component {
  render() {
    const chatListProps = {
      cTopedIds: [],
      cItems: [
        {
          _id: "a1",
          id: "1",
          avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
          name: "this is a 1",
          mainTitle: "ID4321(test1)",
          info: "this is a test1",
          status: "pub",
          userIds: ["2", "3", "4"],
          createTime: "2017/10/18 19:00",
          _version: 1
        },
        {
          _id: "a2",
          id: "2",
          avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
          name: "this is a 2",
          mainTitle: "ID4321(test2)",
          info: "this is a test2",
          status: "pub",
          userIds: ["2", "3", "4"],
          createTime: "2017/10/18 19:00",
          _version: 1
        },
        {
          _id: "a3",
          id: "3",
          avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
          name: "this is a 3",
          mainTitle: "ID4321(test3)",
          info: "this is a test3",
          status: "pub",
          userIds: ["2", "3", "4"],
          createTime: "2017/10/18 19:00",
          _version: 1
        },
        {
          _id: "a4",
          id: "4",
          avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
          name: "this is a 4",
          mainTitle: "ID4321(test4)",
          info: "this is a test4",
          status: "pub",
          userIds: ["2", "3", "4"],
          createTime: "2017/10/18 19:00",
          _version: 1
        }
      ],
      searchbarPlaceholder: "搜索",
      onSearch: () => {
        console.log("searchChats pressed");
      },
      hasSearchBar: true,
      onItemPress: () => {
        console.log("onItemPress pressed");
      },
      topPressed: () => {
        console.log("topPressed pressed");
      },
      unTopPressed: () => {
        console.log("unTopPressed pressed");
      },
      deletePressed: () => {
        console.log("deletePressed pressed");
      },
      unReadNum: 10,
      onScroll: () => {
        console.log("onScroll");
      }
    };

    return (
      <View style={styles.container}>
        <Rooms {...chatListProps} />
      </View>
    );
  }
}

const styles = EStyleSheet.create({
  container: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height
  }
});
