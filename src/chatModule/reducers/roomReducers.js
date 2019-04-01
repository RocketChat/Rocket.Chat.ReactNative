import * as types from "../constants/actionsTypes";

const initialState = {
  rooms: [
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
    },
    {
      _id: "a5",
      id: "5",
      avatar: "https://img3.doubanio.com/img/fmadmin/large/31905.jpg",
      name: "this is a 5",
      mainTitle: "ID4321(test5)",
      info: "this is a test5",
      status: "pub",
      userIds: ["2", "3", "4"],
      createTime: "2017/10/18 19:00",
      _version: 1
    }
  ]
};

export default function roomReducers(state = initialState, action) {
  switch (action.type) {
    case types.ROOMS.SET_ROOMS:
    default:
      return state;
  }
}
