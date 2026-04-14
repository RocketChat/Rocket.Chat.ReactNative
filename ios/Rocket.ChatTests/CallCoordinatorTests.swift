import XCTest
@testable import RocketChatRN

final class CallCoordinatorTests: XCTestCase {

    private var coordinator: CallCoordinator!

    override func setUp() {
        super.setUp()
        coordinator = CallCoordinator()
    }

    override func tearDown() {
        coordinator = nil
        super.tearDown()
    }

    // MARK: - Legal Transitions

    func test_idle_incomingPush_to_incoming() {
        let (state, outputs) = coordinator.transition(state: .idle, input: .incomingPush)
        XCTAssertEqual(state, .incoming)
        XCTAssertEqual(outputs, [.ringOS])
    }

    func test_incoming_userAnswer_to_answering() {
        let (state, outputs) = coordinator.transition(state: .incoming, input: .userAnswer)
        XCTAssertEqual(state, .answering)
        XCTAssertEqual(outputs, [.startAudio])
    }

    func test_incoming_userDecline_to_ended() {
        let (state, outputs) = coordinator.transition(state: .incoming, input: .userDecline)
        XCTAssertEqual(state, .ended)
        XCTAssertEqual(outputs, [.endOS])
    }

    func test_incoming_remoteHangup_to_ended() {
        let (state, outputs) = coordinator.transition(state: .incoming, input: .remoteHangup)
        XCTAssertEqual(state, .ended)
        XCTAssertEqual(outputs, [.endOS])
    }

    func test_answering_restAck_to_active() {
        let (state, outputs) = coordinator.transition(state: .answering, input: .restAck)
        XCTAssertEqual(state, .active)
        XCTAssertEqual(outputs, [])
    }

    func test_active_remoteHangup_to_ending() {
        let (state, outputs) = coordinator.transition(state: .active, input: .remoteHangup)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [])
    }

    func test_active_userDecline_to_ending() {
        let (state, outputs) = coordinator.transition(state: .active, input: .userDecline)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [])
    }

    func test_ending_ddpCallEnded_to_ended() {
        let (state, outputs) = coordinator.transition(state: .ending, input: .ddpCallEnded)
        XCTAssertEqual(state, .ended)
        XCTAssertEqual(outputs, [])
    }

    // MARK: - Illegal Transitions (noop, state unchanged)

    func test_idle_userAnswer_illegal() {
        let (state, outputs) = coordinator.transition(state: .idle, input: .userAnswer)
        XCTAssertEqual(state, .idle)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_idle_userDecline_illegal() {
        let (state, outputs) = coordinator.transition(state: .idle, input: .userDecline)
        XCTAssertEqual(state, .idle)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_idle_remoteHangup_illegal() {
        let (state, outputs) = coordinator.transition(state: .idle, input: .remoteHangup)
        XCTAssertEqual(state, .idle)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_idle_restAck_illegal() {
        let (state, outputs) = coordinator.transition(state: .idle, input: .restAck)
        XCTAssertEqual(state, .idle)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_idle_ddpCallEnded_illegal() {
        let (state, outputs) = coordinator.transition(state: .idle, input: .ddpCallEnded)
        XCTAssertEqual(state, .idle)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_incoming_restAck_illegal() {
        let (state, outputs) = coordinator.transition(state: .incoming, input: .restAck)
        XCTAssertEqual(state, .incoming)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_incoming_ddpCallEnded_illegal() {
        let (state, outputs) = coordinator.transition(state: .incoming, input: .ddpCallEnded)
        XCTAssertEqual(state, .incoming)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_answering_userAnswer_illegal() {
        let (state, outputs) = coordinator.transition(state: .answering, input: .userAnswer)
        XCTAssertEqual(state, .answering)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_answering_userDecline_illegal() {
        let (state, outputs) = coordinator.transition(state: .answering, input: .userDecline)
        XCTAssertEqual(state, .answering)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_answering_remoteHangup_illegal() {
        let (state, outputs) = coordinator.transition(state: .answering, input: .remoteHangup)
        XCTAssertEqual(state, .answering)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_answering_ddpCallEnded_illegal() {
        let (state, outputs) = coordinator.transition(state: .answering, input: .ddpCallEnded)
        XCTAssertEqual(state, .answering)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_active_userAnswer_illegal() {
        let (state, outputs) = coordinator.transition(state: .active, input: .userAnswer)
        XCTAssertEqual(state, .active)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_active_restAck_illegal() {
        let (state, outputs) = coordinator.transition(state: .active, input: .restAck)
        XCTAssertEqual(state, .active)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_ending_userAnswer_illegal() {
        let (state, outputs) = coordinator.transition(state: .ending, input: .userAnswer)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_ending_userDecline_illegal() {
        let (state, outputs) = coordinator.transition(state: .ending, input: .userDecline)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_ending_remoteHangup_illegal() {
        let (state, outputs) = coordinator.transition(state: .ending, input: .remoteHangup)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_ending_restAck_illegal() {
        let (state, outputs) = coordinator.transition(state: .ending, input: .restAck)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [.noop])
    }

    func test_ended_anyInput_illegal() {
        let inputs: [CallInput] = [.incomingPush, .userAnswer, .userDecline, .remoteHangup, .restAck, .ddpCallEnded]
        for input in inputs {
            let (state, outputs) = coordinator.transition(state: .ended, input: input)
            XCTAssertEqual(state, .ended, "ended + \(input) should stay ended")
            XCTAssertEqual(outputs, [.noop], "ended + \(input) should produce noop")
        }
    }

    // MARK: - Full Call Lifecycle

    func test_fullLifecycle_answerPath() {
        // idle -> incoming
        var (state, outputs) = coordinator.transition(state: .idle, input: .incomingPush)
        XCTAssertEqual(state, .incoming)
        XCTAssertEqual(outputs, [.ringOS])

        // incoming -> answering
        (state, outputs) = coordinator.transition(state: state, input: .userAnswer)
        XCTAssertEqual(state, .answering)
        XCTAssertEqual(outputs, [.startAudio])

        // answering -> active
        (state, outputs) = coordinator.transition(state: state, input: .restAck)
        XCTAssertEqual(state, .active)
        XCTAssertEqual(outputs, [])

        // active -> ending (remote hangup)
        (state, outputs) = coordinator.transition(state: state, input: .remoteHangup)
        XCTAssertEqual(state, .ending)
        XCTAssertEqual(outputs, [])

        // ending -> ended
        (state, outputs) = coordinator.transition(state: state, input: .ddpCallEnded)
        XCTAssertEqual(state, .ended)
        XCTAssertEqual(outputs, [])
    }

    func test_fullLifecycle_declinePath() {
        // idle -> incoming
        var (state, outputs) = coordinator.transition(state: .idle, input: .incomingPush)
        XCTAssertEqual(state, .incoming)

        // incoming -> ended (decline)
        (state, outputs) = coordinator.transition(state: state, input: .userDecline)
        XCTAssertEqual(state, .ended)
        XCTAssertEqual(outputs, [.endOS])
    }
}
