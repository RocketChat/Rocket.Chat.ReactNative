import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

struct ConferenceLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ConferenceActivityAttributes.self) { context in
            ConferenceLockScreenView(attributes: context.attributes, state: context.state)
                .padding(16)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "video.fill")
                        .font(.title3)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.title)
                        .font(.headline)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.attributes.startedAt, style: .timer)
                        .monospacedDigit()
                        .frame(width: 56, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ConferenceControlButtons(state: context.state)
                }
            } compactLeading: {
                Image(systemName: "video.fill")
            } compactTrailing: {
                Image(systemName: context.state.micEnabled ? "mic.fill" : "mic.slash.fill")
                    .foregroundStyle(context.state.micEnabled ? Color.primary : Color.red)
            } minimal: {
                Image(systemName: "video.fill")
            }
        }
    }
}

private struct ConferenceLockScreenView: View {
    let attributes: ConferenceActivityAttributes
    let state: ConferenceActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "video.fill")
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(attributes.title)
                        .font(.headline)
                        .lineLimit(1)
                    Text(attributes.startedAt, style: .timer)
                        .font(.subheadline)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: state.micEnabled ? "mic.fill" : "mic.slash.fill")
                    .font(.title3)
                    .foregroundStyle(state.micEnabled ? Color.primary : Color.red)
            }
            ConferenceControlButtons(state: state)
        }
    }
}

private struct ConferenceControlButtons: View {
    let state: ConferenceActivityAttributes.ContentState

    var body: some View {
        if #available(iOS 17.0, *) {
            HStack(spacing: 12) {
                if state.micEnabled {
                    Button(intent: MuteConferenceMicIntent()) {
                        ConferenceButtonLabel(title: state.labels.mute, systemImage: "mic.slash.fill")
                    }
                    .tint(.gray)
                } else {
                    Button(intent: UnmuteConferenceMicIntent()) {
                        ConferenceButtonLabel(title: state.labels.unmute, systemImage: "mic.fill")
                    }
                    .tint(.gray)
                }
                Button(intent: LeaveConferenceIntent()) {
                    ConferenceButtonLabel(title: state.labels.leave, systemImage: "phone.down.fill")
                }
                .tint(.red)
            }
            .buttonStyle(.borderedProminent)
        }
    }
}

private struct ConferenceButtonLabel: View {
    let title: String
    let systemImage: String

    var body: some View {
        Label(title, systemImage: systemImage)
            .font(.subheadline.weight(.semibold))
            .lineLimit(1)
            .frame(maxWidth: .infinity)
    }
}
