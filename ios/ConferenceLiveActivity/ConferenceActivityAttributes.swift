import ActivityKit
import Foundation

struct ConferenceActivityAttributes: ActivityAttributes {
    struct Labels: Codable, Hashable {
        var mute: String
        var unmute: String
        var leave: String
    }

    struct ContentState: Codable, Hashable {
        var micEnabled: Bool
        var labels: Labels
    }

    var title: String
    var startedAt: Date
}
