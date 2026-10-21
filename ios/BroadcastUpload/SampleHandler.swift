//
//  SampleHandler.swift
//  BroadcastUpload
//
//  Adapted from the LiveKit React Native example broadcast extension (Apache License 2.0),
//  itself derived from the Jitsi Meet broadcast extension.
//

import ReplayKit

private enum Constants {
    static let appGroupInfoKey = "RTCAppGroupIdentifier"
    static let socketFileName = "rtc_SSFD"
    static let screenSharingStoppedCode = 10001
    static let frameInterval = 3
}

class SampleHandler: RPBroadcastSampleHandler {

    private var clientConnection: SocketConnection?
    private var uploader: SampleUploader?

    private var frameCount: Int = 0

    private var socketFilePath: String {
        guard
            let appGroupIdentifier = Bundle.main.object(forInfoDictionaryKey: Constants.appGroupInfoKey) as? String,
            let sharedContainer = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier)
        else {
            return ""
        }
        return sharedContainer.appendingPathComponent(Constants.socketFileName).path
    }

    override init() {
        super.init()

        if let connection = SocketConnection(filePath: socketFilePath) {
            clientConnection = connection
            setupConnection()

            uploader = SampleUploader(connection: connection)
        }
    }

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        frameCount = 0
        openConnection()
    }

    override func broadcastFinished() {
        clientConnection?.close()
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        switch sampleBufferType {
        case RPSampleBufferType.video:
            frameCount += 1
            if frameCount % Constants.frameInterval == 0 {
                uploader?.send(sample: sampleBuffer)
            }
        default:
            break
        }
    }
}

private extension SampleHandler {

    func setupConnection() {
        clientConnection?.didClose = { [weak self] error in
            if let error = error {
                self?.finishBroadcastWithError(error)
            } else {
                let customError = NSError(
                    domain: RPRecordingErrorDomain,
                    code: Constants.screenSharingStoppedCode,
                    userInfo: [NSLocalizedDescriptionKey: "Screen sharing stopped"]
                )
                self?.finishBroadcastWithError(customError)
            }
        }
    }

    func openConnection() {
        let queue = DispatchQueue(label: "broadcast.connectTimer")
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now(), repeating: .milliseconds(100), leeway: .milliseconds(500))
        timer.setEventHandler { [weak self] in
            guard self?.clientConnection?.open() == true else {
                return
            }

            timer.cancel()
        }

        timer.resume()
    }
}
