import Foundation

final class RoomViewModel: ObservableObject {
  @Published var room: Room
  @Published var server: Server
  
  init(room: Room, server: Server) {
    self.room = room
    self.server = server
  }
  
  var title: String? {
      if isGroupChat, (room.name == nil || room.name?.isEmpty == true), let usernames = room.usernames {
          return usernames
              .filter { $0 == server.loggedUser.username }
              .sorted()
              .joined(separator: ", ")
      }
      
      if room.t != "d" {
          if let fname = room.fname {
              return fname
          } else if let name = room.name {
              return name
          }
      }
      
      if room.prid != nil || server.useRealName {
          return room.fname
      }
      
      return room.name
  }
  
  var iconName: String? {
      if room.prid != nil {
          return "discussions"
      } else if room.teamMain == true, room.t == "p" {
          return "teams-private"
      } else if room.teamMain == true {
          return "teams"
      } else if room.t == "p" {
          return "channel-private"
      } else if room.t == "c" {
          return "channel-public"
      } else if room.t == "d", isGroupChat {
          return "message"
      }
      
      return nil
  }
  
  var lastMessage: String {
      guard let user = room.lastMessage?.user else {
          return "No Message"
      }
      
      let isLastMessageSentByMe = user.username == server.loggedUser.username
      let username = isLastMessageSentByMe ? "You" : ((server.useRealName ? user.name : user.username) ?? "")
      let message = room.lastMessage?.msg ?? "No message"
      
      if room.lastMessage?.t == "jitsi_call_started" {
          return "Call started by: \(username)"
      }
      
      if room.lastMessage?.attachments?.allObjects.isEmpty == false {
          return "\(username) sent an attachment"
      }
      
      if room.lastMessage?.t == "e2e" {
          return "Encrypted message"
      }
      
      if room.lastMessage?.t == "videoconf" {
          return "Call started"
      }
      
      if room.t == "d", !isLastMessageSentByMe {
          return message
      }
      
      return "\(username): \(message)"
  }
  
  var isGroupChat: Bool {
      if let uids = room.uids, uids.count > 2 {
          return true
      }
      
      if let usernames = room.usernames, usernames.count > 2 {
          return true
      }
      
      return false
  }
  
  var updatedAt: String? {
      guard let ts = room.ts else {
        return nil
      }
      
      let calendar = Calendar.current
      let dateFormatter = DateFormatter()
      dateFormatter.locale = Locale.current
      dateFormatter.timeZone = TimeZone.current
      
      if calendar.isDateInYesterday(ts) {
          return "Yesterday"
      }
      
      if calendar.isDateInToday(ts) {
          dateFormatter.timeStyle = .short
          dateFormatter.dateStyle = .none
          
          return dateFormatter.string(from: ts)
      }
      
      if isInPreviousWeek(date: ts) {
          dateFormatter.dateFormat = "EEEE"
          
          return dateFormatter.string(from: ts)
      }
      
      dateFormatter.timeStyle = .none
      dateFormatter.dateStyle = .short
      
      return dateFormatter.string(from: ts)
  }
  
  private func isInPreviousWeek(date: Date) -> Bool {
      let oneDay = 24 * 60 * 60
      let calendar = Calendar.current
      let currentDate = Date()
      let lastWeekDate = currentDate.addingTimeInterval(TimeInterval(-7 * oneDay))
      
      return calendar.isDate(
          date,
          equalTo: lastWeekDate,
          toGranularity: .weekOfYear
      )
  }
}
