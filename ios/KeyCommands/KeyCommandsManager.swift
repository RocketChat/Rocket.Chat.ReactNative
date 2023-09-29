@objc protocol KeyCommandHandler {
  func onKeyCommand(_ command: UIKeyCommand)
}

@objc(KeyCommandsManager)
final class KeyCommandsManager: RCTEventEmitter {
  @objc
  private(set) static var shared: KeyCommandsManager?
  
  @objc
  private(set) var commands: [UIKeyCommand] = []
  
  @objc
  static var handler: KeyCommandHandler?
  
  private struct Event {
    static let onKeyCommand = "onKeyCommand"
  }
  
  override init() {
    super.init()
    KeyCommandsManager.shared = self
  }
  
  override func supportedEvents() -> [String] {
    [Event.onKeyCommand]
  }
  
  @objc
  func registerKeyCommand(_ input: NSString, modifierFlags: NSNumber, discoverableTitle: NSString) {
    guard let handler = KeyCommandsManager.handler else {
      return
    }
    
    let command = UIKeyCommand(
      input: String(input),
      modifierFlags: UIKeyModifierFlags(rawValue: modifierFlags.intValue),
      action: #selector(handler.onKeyCommand(_:)),
      discoverabilityTitle: String(discoverableTitle)
    )
    
    if #available(iOS 15.0, *) {
      command.wantsPriorityOverSystemBehavior = true
    }
    
    commands.append(command)
  }
  
  @objc
  func onKeyCommand(_ command: UIKeyCommand) {
    guard let input = command.input, let discoverabilityTitle = command.discoverabilityTitle else {
      return
    }
    
    let body: [String: Any] = [
      "input": input,
      "modifierFlags": NSNumber(integerLiteral: command.modifierFlags.rawValue),
      "discoverableTitle": discoverabilityTitle
    ]
    
    sendEvent(withName: Event.onKeyCommand, body: body)
  }
}
