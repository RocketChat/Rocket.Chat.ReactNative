import Foundation

// MARK: - CallState

/// Pure Swift enum representing the state of a VoIP call.
/// No CallKit, PushKit, or AVAudioSession types.
public enum CallState: Equatable {
    case idle
    case incoming
    case answering
    case active
    case ending
    case ended
}

// MARK: - CallInput

/// Pure Swift enum representing inputs (events) that drive state transitions.
public enum CallInput: Equatable {
    case incomingPush
    case userAnswer
    case userDecline
    case remoteHangup
    case restAck
    case ddpCallEnded
}

// MARK: - CallOutput

/// Pure Swift struct representing outputs (actions) produced by state transitions.
/// No OS framework types (CXProvider, AVAudioSession, etc.).
public struct CallOutput: Equatable {
    public let ringOS: Bool
    public let startAudio: Bool
    public let endOS: Bool
    public let noop: Bool

    public init(ringOS: Bool = false, startAudio: Bool = false, endOS: Bool = false, noop: Bool = false) {
        self.ringOS = ringOS
        self.startAudio = startAudio
        self.endOS = endOS
        self.noop = noop
    }

    public static let noop = CallOutput(noop: true)
    public static let ringOS = CallOutput(ringOS: true)
    public static let startAudio = CallOutput(startAudio: true)
    public static let endOS = CallOutput(endOS: true)
}

// MARK: - CallCoordinator

/// Pure Swift state machine for VoIP call orchestration.
/// Does not import CallKit, PushKit, or AVFoundation.
public final class CallCoordinator {

    public init() {}

    /// Transitions the state machine from the current state by applying the given input.
    /// - Parameters:
    ///   - state: The current state.
    ///   - input: The input event to process.
    /// - Returns: A tuple of the new state and an array of outputs to execute.
    public func transition(state: CallState, input: CallInput) -> (state: CallState, outputs: [CallOutput]) {
        switch (state, input) {
        // idle -> incoming (on push)
        case (.idle, .incomingPush):
            return (.incoming, [.ringOS])

        // incoming -> answering (user answers)
        case (.incoming, .userAnswer):
            return (.answering, [.startAudio])

        // incoming -> ended (user declines)
        case (.incoming, .userDecline):
            return (.ended, [.endOS])

        // incoming -> ended (timeout, treated same as userDecline)
        case (.incoming, .remoteHangup):
            return (.ended, [.endOS])

        // answering -> active (REST ack received)
        case (.answering, .restAck):
            return (.active, [])

        // active -> ending (remote hangs up)
        case (.active, .remoteHangup):
            return (.ending, [])

        // active -> ending (user ends call)
        case (.active, .userDecline):
            return (.ending, [])

        // ending -> ended (DDP call-ended received)
        case (.ending, .ddpCallEnded):
            return (.ended, [])

        // Illegal transitions: return noop and keep current state
        case (.idle, .userAnswer),
             (.idle, .userDecline),
             (.idle, .remoteHangup),
             (.idle, .restAck),
             (.idle, .ddpCallEnded):
            return (.idle, [.noop])

        case (.incoming, .incomingPush),
             (.incoming, .restAck),
             (.incoming, .ddpCallEnded):
            return (.incoming, [.noop])

        case (.answering, .incomingPush),
             (.answering, .userAnswer),
             (.answering, .userDecline),
             (.answering, .remoteHangup),
             (.answering, .ddpCallEnded):
            return (.answering, [.noop])

        case (.active, .incomingPush),
             (.active, .userAnswer),
             (.active, .restAck),
             (.active, .ddpCallEnded):
            return (.active, [.noop])

        case (.ending, .incomingPush),
             (.ending, .userAnswer),
             (.ending, .userDecline),
             (.ending, .remoteHangup),
             (.ending, .restAck):
            return (.ending, [.noop])

        case (.ended, .incomingPush),
             (.ended, .userAnswer),
             (.ended, .userDecline),
             (.ended, .remoteHangup),
             (.ended, .restAck),
             (.ended, .ddpCallEnded):
            return (.ended, [.noop])
        }
    }
}
