#import "A11yEventEmitter.h"

@implementation A11yEventEmitter

RCT_EXPORT_MODULE();

// Supported Events
- (NSArray<NSString *> *)supportedEvents {
    return @[@"onAccessibilityFocusChange", @"onVoiceOverStatusChanged"];
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // Observe accessibility notifications
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleFocusChange:)
                                                     name:UIAccessibilityFocusedElementDidChangeNotification
                                                   object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleVoiceOverStatusChange:)
                                                     name:UIAccessibilityVoiceOverStatusChanged
                                                   object:nil];
    }
    return self;
}

// Handle Focus Changes
- (void)handleFocusChange:(NSNotification *)notification {
    id focusedElement = UIAccessibilityFocusedElement(UIAccessibilityNotificationVoiceOver);
    [self sendEventWithName:@"onAccessibilityFocusChange" body:@{@"focusedElement": focusedElement ?: [NSNull null]}];
}

// Handle VoiceOver Status Changes
- (void)handleVoiceOverStatusChange:(NSNotification *)notification {
    BOOL isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
    [self sendEventWithName:@"onVoiceOverStatusChanged" body:@{@"isEnabled": @(isVoiceOverEnabled)}];
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
