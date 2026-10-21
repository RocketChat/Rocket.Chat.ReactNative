import ActivityKit
import AppIntents
import Foundation

@MainActor
enum ConferenceLiveActivityBridge {
    static var handler: ((String) -> Void)?

    static func perform(_ action: String) async {
        if let handler {
            handler(action)
        } else if action == "leave" {
            await endAll()
        }
    }

    static func endAll() async {
        for activity in Activity<ConferenceActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}

@available(iOS 17.0, *)
struct MuteConferenceMicIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Mute the microphone"
    static var isDiscoverable = false

    @MainActor
    func perform() async throws -> some IntentResult {
        await ConferenceLiveActivityBridge.perform("mute")
        return .result()
    }
}

@available(iOS 17.0, *)
struct UnmuteConferenceMicIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Unmute the microphone"
    static var isDiscoverable = false
    static var authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

    @MainActor
    func perform() async throws -> some IntentResult {
        await ConferenceLiveActivityBridge.perform("unmute")
        return .result()
    }
}

@available(iOS 17.0, *)
struct LeaveConferenceIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Leave the call"
    static var isDiscoverable = false

    @MainActor
    func perform() async throws -> some IntentResult {
        await ConferenceLiveActivityBridge.perform("leave")
        return .result()
    }
}
