//StyleSheet for components such as ChatList
export const ListStyles = {
  container: {
    flex: 1
  },
  cell: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 5,
    margin: 3,
    marginTop: 1,
    marginBottom: 1,
    // height: 150,
    padding: 5,
    shadowColor: "#ccc",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3
    // width: "100%-6"
  },
  setTopStyle: {
    backgroundColor: "#F8F8FF"
  },

  //searchbar
  heightAdjust: -10,
  searchbarHeight: "2.625rem",
  hasSearchBar: {
    marginTop: "2.625rem"
  },

  // vendue
  cellStatus: {
    backgroundColor: "transparent",
    position: "absolute",
    right: 5,
    top: 10,
    width: "3.75rem", //60
    flexDirection: "column",
    alignItems: "center"
  },
  cellStatusText: {
    fontSize: "$TEXT_LARGETEXT",
    fontWeight: "bold",
    color: "navy",
    textAlign: "center",
    backgroundColor: "transparent"
  },
  cellStatusLittleText: {
    fontSize: "$TEXT_LONGTEXT",
    fontWeight: "bold",
    color: "gray"
  },
  bottomInfoStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: "transparent",
    width: "100% - 1.25rem" //20
  },

  // chat
  itemHeight: "4.25rem",
  promptText: {
    fontSize: "$TEXT_LARGETEXT",
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 3,
    overflow: "hidden"
  },
  avatarContainerStyle: {
    width: "3.75rem"
  },
  avatarStyle: {
    width: "3.125rem",
    height: "3.125rem",
    borderRadius: "3.125rem / 2"
  },
  avatarTextStyle: {
    fontSize: "$TEXT_LONGTEXT"
  },
  introInfoStyle: {
    width: "100% - 9.375rem"
  },
  mainTitleStyle: {
    fontSize: "$TEXT_SHORTTEXT"
  },
  infoStyle: {
    fontSize: "$TEXT_LONGTEXT"
  },
  introImageStyle: {
    width: "6.25rem",
    height: "6.25rem"
  },

  // phoneMediaList
  cell1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "rgba(0,0,0,0.1)",
    // borderRadius: 5,
    margin: 0,
    marginTop: 0,
    marginBottom: 0.5,
    // height: 150,
    padding: 5,
    // shadowColor: '#ccc',
    // shadowOffset: { width: 2, height: 2, },
    // shadowOpacity: 0.5,
    // shadowRadius: 3,
    width: "100%"
  }
};
