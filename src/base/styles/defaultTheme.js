// 把styles和funcs一样做成包，这样对于所有外部自定义组件都可以共用，方便集成,react-native-bootStrap。

export default {
  $theme: "default",
  $locale: "zh-cn",

  // app
  "@media ios": {
    $STATUSBAR_HEIGHT: 20,
    $APPBAR_HEIGHT: 44
  },
  "@media android": {
    $STATUSBAR_HEIGHT: 0,
    $APPBAR_HEIGHT: 56
  },

  //字体
  $TEXT_ANNOTATE: "0.65625rem",
  $TEXT_LONGTEXT: "0.75rem",
  $TEXT_SHORTTEXT: "0.8125rem",
  $TEXT_MIDDLETEXT: "0.9375rem",
  $TEXT_LARGETEXT: "1rem",
  $TEXT_HUGETEXT: "1.2rem",

  //图标
  $ICON_LARGE: "2rem",

  //颜色
  $DODERBLUE: "#1E90FF", //道奇蓝
  $LIGHTGRAY: "#F8F8F8", //浅灰
  $DARKGRAY: "#9B9FA4", //深灰
  $DIVIDE: "rgba(229,229,230,1)", //分割线

  $SECTION_HEADER_HEIGHT: "1.3rem" //chatSectionList's section
};
