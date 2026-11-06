import ActivityKit
import Foundation

@objc(ConferenceLiveActivityLabels)
public final class ConferenceLiveActivityLabels: NSObject {
    fileprivate let labels: ConferenceActivityAttributes.Labels

    @objc public init(mute: String, unmute: String, leave: String) {
        labels = ConferenceActivityAttributes.Labels(mute: mute, unmute: unmute, leave: leave)
    }
}

@objc(ConferenceLiveActivityManager)
public final class ConferenceLiveActivityManager: NSObject {
    private enum Operation {
        case start(title: String, state: ConferenceActivityAttributes.ContentState)
        case update(ConferenceActivityAttributes.ContentState)
        case endAll
    }

    private static let serialOperations: AsyncStream<Operation>.Continuation = {
        var continuation: AsyncStream<Operation>.Continuation!
        let stream = AsyncStream<Operation> { continuation = $0 }
        Task {
            for await operation in stream {
                await run(operation)
            }
        }
        return continuation
    }()

    @objc public static func start(title: String, micEnabled: Bool, labels: ConferenceLiveActivityLabels) {
        let state = ConferenceActivityAttributes.ContentState(micEnabled: micEnabled, labels: labels.labels)
        serialOperations.yield(.start(title: title, state: state))
    }

    @objc public static func update(micEnabled: Bool, labels: ConferenceLiveActivityLabels) {
        let state = ConferenceActivityAttributes.ContentState(micEnabled: micEnabled, labels: labels.labels)
        serialOperations.yield(.update(state))
    }

    @objc public static func endAll() {
        serialOperations.yield(.endAll)
    }

    @objc public static func setActionHandler(_ handler: ((String) -> Void)?) {
        Task { @MainActor in
            ConferenceLiveActivityBridge.handler = handler
        }
    }

    private static func run(_ operation: Operation) async {
        switch operation {
        case let .start(title, state):
            await ConferenceLiveActivityBridge.endAll()
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                return
            }
            do {
                _ = try Activity.request(
                    attributes: ConferenceActivityAttributes(title: title, startedAt: Date()),
                    content: ActivityContent(state: state, staleDate: nil),
                    pushType: nil
                )
            } catch {
                NSLog("[ConferenceLiveActivity] could not start the Live Activity: \(error)")
            }
        case let .update(state):
            for activity in Activity<ConferenceActivityAttributes>.activities {
                await activity.update(ActivityContent(state: state, staleDate: nil))
            }
        case .endAll:
            await ConferenceLiveActivityBridge.endAll()
        }
    }
}
