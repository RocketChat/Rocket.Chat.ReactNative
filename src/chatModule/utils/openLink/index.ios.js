// import SafariView from "react-native-safari-view";
import { web } from "react-native-communications";

// const openLink = url => SafariView.show({ url, fromBottom: true, tintColor: '#292E35' });
const openLink = url => web(url);

export default openLink;
