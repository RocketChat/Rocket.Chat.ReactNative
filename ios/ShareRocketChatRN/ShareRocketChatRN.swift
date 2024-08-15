//
//  ShareRocketChatRN.swift
//  ShareRocketChatRN
//
//  Created by Diego Mello on 8/15/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import UIKit

class ShareRocketChatRN: UIViewController {
    // TODO: whitelabel?
    let appScheme = "rocketchat"

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments,
              let firstAttachment = attachments.first else {
            self.completeRequest()
            return
        }

        Task {
            if firstAttachment.hasItemConformingToTypeIdentifier("public.text") {
                await self.handleText(item: firstAttachment)
            } else if firstAttachment.hasItemConformingToTypeIdentifier("public.url") {
                await self.handleUrl(item: firstAttachment)
            } else if firstAttachment.hasItemConformingToTypeIdentifier("public.image") {
                await self.handleMedia(items: attachments, type: "public.image")
            } else if firstAttachment.hasItemConformingToTypeIdentifier("public.movie") {
                await self.handleMedia(items: attachments, type: "public.movie")
            } else if firstAttachment.hasItemConformingToTypeIdentifier("public.data") {
                await self.handleDocs(items: attachments)
            } else {
                self.completeRequest()
            }
        }
    }

    private func handleText(item: NSItemProvider) async {
        do {
            if let data = try await item.loadItem(forTypeIdentifier: "public.text") as? String {
                if let encoded = data.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
                   let url = URL(string: "\(self.appScheme)://shareextension?text=\(encoded)") {
                    _ = self.openURL(url)
                }
            }
            self.completeRequest()
        } catch {
            self.completeRequest()
        }
    }

    private func handleUrl(item: NSItemProvider) async {
        do {
            if let data = try await item.loadItem(forTypeIdentifier: "public.url") as? URL {
                if let encoded = data.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
                   let url = URL(string: "\(self.appScheme)://shareextension?url=\(encoded)") {
                    _ = self.openURL(url)
                }
            }
            self.completeRequest()
        } catch {
            self.completeRequest()
        }
    }

    private func handleMedia(items: [NSItemProvider], type: String) async {
        var valid = true
        var mediaUris = ""

        for (index, item) in items.enumerated() {
            var mediaUriInfo: String?

            do {
                if let dataUri = try await item.loadItem(forTypeIdentifier: type) as? URL {
                    let data = try Data(contentsOf: dataUri)
                    let filename = UUID().uuidString
                    let savedUrl = self.saveDataToSharedContainer(data: data, filename: "\(filename).\(self.fileExtension(forType: type))")
                    mediaUriInfo = savedUrl?.absoluteString
                } else if let data = try await item.loadItem(forTypeIdentifier: type) as? Data {
                    let filename = UUID().uuidString
                    let savedUrl = self.saveDataToSharedContainer(data: data, filename: "\(filename).\(self.fileExtension(forType: type))")
                    mediaUriInfo = savedUrl?.absoluteString
                }
            } catch {
                valid = false
            }

            if let mediaUriInfo = mediaUriInfo {
                mediaUris.append(mediaUriInfo)
                if index < items.count - 1 {
                    mediaUris.append(",")
                }
            } else {
                valid = false
            }
        }

        if valid,
           let encoded = mediaUris.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
           let url = URL(string: "\(self.appScheme)://shareextension?mediaUris=\(encoded)") {
            _ = self.openURL(url)
        }

        self.completeRequest()
    }

    private func handleDocs(items: [NSItemProvider]) async {
        await self.handleMedia(items: items, type: "public.data")
    }

    private func saveDataToSharedContainer(data: Data, filename: String) -> URL? {
        // TODO: read info.plist
        guard let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.ios.chat.rocket") else {
            return nil
        }
        let fileURL = groupURL.appendingPathComponent(filename)
        do {
            try data.write(to: fileURL)
            return fileURL
        } catch {
            return nil
        }
    }

    // TODO: find a better way
    private func fileExtension(forType type: String) -> String {
        switch type {
        case "public.image":
            return "jpeg"
        case "public.movie":
            return "mov"
        case "public.data":
            return "dat"
        default:
            return "bin"
        }
    }

    @objc private func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                return application.perform(#selector(openURL(_:)), with: url) != nil
            }
            responder = responder?.next
        }
        return false
    }

    private func completeRequest() {
        self.extensionContext?.completeRequest(returningItems: nil)
    }
}
