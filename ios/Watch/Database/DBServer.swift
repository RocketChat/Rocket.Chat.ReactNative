import Foundation

struct DBServer: Codable {
  let url: URL
  let name: String
  let useRealName: Int
  let iconURL: URL
  
  var identifier: String {
    url.absoluteString
  }
  
  enum CodingKeys: String, CodingKey {
    case url = "id"
    case name
    case useRealName = "use_real_name"
    case iconURL = "icon_url"
  }
}
