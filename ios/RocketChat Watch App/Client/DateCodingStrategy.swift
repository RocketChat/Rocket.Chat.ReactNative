// https://stackoverflow.com/a/28016692

import Foundation

extension Date.ISO8601FormatStyle {
	static let iso8601withFractionalSeconds: Self = .init(includingFractionalSeconds: true)
}

extension ParseStrategy where Self == Date.ISO8601FormatStyle {
	static var iso8601withFractionalSeconds: Date.ISO8601FormatStyle { .iso8601withFractionalSeconds }
}

extension FormatStyle where Self == Date.ISO8601FormatStyle {
	static var iso8601withFractionalSeconds: Date.ISO8601FormatStyle { .iso8601withFractionalSeconds }
}

extension Date {
	init(iso8601withFractionalSeconds parseInput: ParseStrategy.ParseInput) throws {
		try self.init(parseInput, strategy: .iso8601withFractionalSeconds)
	}
	
	var iso8601withFractionalSeconds: String {
		formatted(.iso8601withFractionalSeconds)
	}
}

extension String {
	func iso8601withFractionalSeconds() throws -> Date {
		try .init(iso8601withFractionalSeconds: self)
	}
}

extension JSONDecoder.DateDecodingStrategy {
	static let iso8601withFractionalSeconds = custom {
		try .init(iso8601withFractionalSeconds: $0.singleValueContainer().decode(String.self))
	}
}

extension JSONEncoder.DateEncodingStrategy {
	static let iso8601withFractionalSeconds = custom {
		var container = $1.singleValueContainer()
		try container.encode($0.iso8601withFractionalSeconds)
	}
}
