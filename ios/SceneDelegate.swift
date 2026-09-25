import Expo
import UIKit

@available(iOSApplicationExtension, unavailable)
class SceneDelegate: ExpoAppSceneDelegate {
  override func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    super.scene(scene, willConnectTo: session, options: connectionOptions)

    if let rootViewController = window?.rootViewController {
      RNBootSplash.initWithStoryboard("LaunchScreen", rootView: rootViewController.view)
    }
  }
}
