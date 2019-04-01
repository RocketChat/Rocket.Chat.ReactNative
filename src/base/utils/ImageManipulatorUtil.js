import { ImageManipulator, FileSystem } from "expo";
import { Dimensions } from "react-native";

export function compress(uri, compressRate, cb) {
  var myPromise = new Promise(function(resolve, reject) {
    var x = ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: Dimensions.get("window").width } }],
      { compress: compressRate, format: "jpeg" }
    );
    resolve(x);
  });

  myPromise
    .then(function(x) {
      console.log(JSON.stringify("ImageManipulator:" + x));
      cb(null, x);
    })
    .catch(error => {
      console.log("ImageManipulator error: " + error);
      cb(error);
    });
}
