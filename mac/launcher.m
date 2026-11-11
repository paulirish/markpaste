#import <AppKit/AppKit.h>
#import <signal.h>
#import <stdio.h>
#import <stdlib.h>

static void showError(NSString *title, NSString *message) {
    NSString *safeTitle = title ?: @"MarkPaste Error";
    NSString *safeMessage = message ?: @"";
    fprintf(stderr, "%s: %s\n", safeTitle.UTF8String, safeMessage.UTF8String);
    if (getenv("MP_NO_DIALOG") != NULL) {
        return;
    }

    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [NSApp activateIgnoringOtherApps:YES];

    NSAlert *alert = [[NSAlert alloc] init];
    alert.alertStyle = NSAlertStyleCritical;
    alert.messageText = safeTitle;
    alert.informativeText = safeMessage;
    [alert addButtonWithTitle:@"OK"];
    [alert runModal];
}

static NSString *findNodeExecutable(void) {
    NSFileManager *fm = NSFileManager.defaultManager;
    NSMutableArray<NSString *> *candidates = [NSMutableArray array];

    const char *envPath = getenv("PATH");
    if (envPath != NULL) {
        NSString *pathStr = [NSString stringWithUTF8String:envPath];
        [candidates addObjectsFromArray:[pathStr componentsSeparatedByString:@":"]];
    }

    NSString *home = NSHomeDirectory();
    [candidates addObjectsFromArray:@[
        @"/opt/homebrew/bin",
        @"/usr/local/bin",
        [home stringByAppendingPathComponent:@".volta/bin"],
        [home stringByAppendingPathComponent:@".local/share/mise/shims"],
        [home stringByAppendingPathComponent:@".asdf/shims"],
        [home stringByAppendingPathComponent:@".fnm/aliases/default/bin"],
    ]];

    for (NSString *dir in candidates) {
        if (dir.length == 0) continue;
        NSString *nodePath = [dir stringByAppendingPathComponent:@"node"];
        if ([fm isExecutableFileAtPath:nodePath]) {
            return nodePath;
        }
    }

    NSString *nvmDir = [home stringByAppendingPathComponent:@".nvm/versions/node"];
    NSArray<NSString *> *versions = [fm contentsOfDirectoryAtPath:nvmDir error:nil];
    if (versions.count > 0) {
        NSArray<NSString *> *sorted = [versions sortedArrayUsingComparator:^NSComparisonResult(NSString *a, NSString *b) {
            return [b compare:a options:NSNumericSearch];
        }];
        for (NSString *ver in sorted) {
            NSString *nodePath = [[nvmDir stringByAppendingPathComponent:ver] stringByAppendingPathComponent:@"bin/node"];
            if ([fm isExecutableFileAtPath:nodePath]) {
                return nodePath;
            }
        }
    }

    return nil;
}

static NSString *readHtmlFromPasteboard(NSPasteboard *pb) {
    NSString *html = [pb stringForType:NSPasteboardTypeHTML];
    if (html) {
        return html;
    }
    NSData *htmlData = [pb dataForType:NSPasteboardTypeHTML];
    if (htmlData.length == 0) {
        return nil;
    }
    html = [[NSString alloc] initWithData:htmlData encoding:NSUTF8StringEncoding];
    return html ?: [[NSString alloc] initWithData:htmlData encoding:NSWindowsCP1252StringEncoding];
}

static NSDictionary<NSString *, NSString *> *buildChildEnvironment(NSString *nodePath) {
    NSMutableDictionary<NSString *, NSString *> *env = [NSProcessInfo.processInfo.environment mutableCopy];
    NSString *home = NSHomeDirectory();
    NSArray<NSString *> *prefix = @[
        [nodePath stringByDeletingLastPathComponent],
        @"/opt/homebrew/bin",
        @"/usr/local/bin",
        [home stringByAppendingPathComponent:@".local/bin"],
    ];
    NSString *existingPath = env[@"PATH"];
    NSString *joined = [prefix componentsJoinedByString:@":"];
    env[@"PATH"] = existingPath.length > 0 ? [NSString stringWithFormat:@"%@:%@", joined, existingPath] : joined;
    return env;
}

int main(int argc, const char *argv[]) {
    (void)argc;
    (void)argv;
    signal(SIGPIPE, SIG_IGN);

    @autoreleasepool {
        NSString *scriptPath = [NSBundle.mainBundle pathForResource:@"markpaste" ofType:@"mjs"];
        if (!scriptPath) {
            showError(@"MarkPaste Error", @"Cannot find bundled markpaste.mjs inside the application bundle.");
            return 1;
        }

        NSString *nodePath = findNodeExecutable();
        if (!nodePath) {
            showError(@"Node.js Missing",
                      @"MarkPaste requires Node.js to be installed. Please install Node.js (e.g. via Homebrew or nodejs.org) and try again.");
            return 1;
        }

        NSPasteboard *pb = [NSPasteboard generalPasteboard];
        NSString *rawHtml = readHtmlFromPasteboard(pb);
        NSString *rawText = [pb stringForType:NSPasteboardTypeString];

        NSDictionary *inputObj = @{
            @"html": rawHtml ?: NSNull.null,
            @"text": rawText ?: NSNull.null,
        };
        NSError *jsonError = nil;
        NSData *stdinData = [NSJSONSerialization dataWithJSONObject:inputObj options:0 error:&jsonError];
        if (!stdinData) {
            showError(@"MarkPaste Error", jsonError.localizedDescription ?: @"Failed to encode clipboard payload.");
            return 1;
        }

        NSTask *task = [[NSTask alloc] init];
        task.executableURL = [NSURL fileURLWithPath:nodePath];
        task.arguments = @[scriptPath, @"--stdio"];
        task.environment = buildChildEnvironment(nodePath);

        NSPipe *inPipe = [NSPipe pipe];
        NSPipe *outPipe = [NSPipe pipe];
        NSPipe *errPipe = [NSPipe pipe];
        task.standardInput = inPipe;
        task.standardOutput = outPipe;
        task.standardError = errPipe;

        NSError *launchError = nil;
        if (![task launchAndReturnError:&launchError]) {
            showError(@"MarkPaste Error", launchError.localizedDescription ?: @"Failed to launch Node.js.");
            return 1;
        }

        // Write stdin and drain stdout/stderr concurrently to avoid pipe deadlocks on large clipboards.
        dispatch_queue_t q = dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0);
        dispatch_group_t group = dispatch_group_create();
        __block NSData *outData = nil;
        __block NSData *errData = nil;

        dispatch_group_async(group, q, ^{
            NSFileHandle *writer = inPipe.fileHandleForWriting;
            [writer writeData:stdinData error:nil];
            [writer closeAndReturnError:nil];
        });
        dispatch_group_async(group, q, ^{
            outData = [outPipe.fileHandleForReading readDataToEndOfFileAndReturnError:nil];
        });
        dispatch_group_async(group, q, ^{
            errData = [errPipe.fileHandleForReading readDataToEndOfFileAndReturnError:nil];
        });

        dispatch_time_t timeout = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(15 * NSEC_PER_SEC));
        if (dispatch_group_wait(group, timeout) != 0) {
            [task terminate];
            showError(@"MarkPaste Error", @"MarkPaste conversion timed out.");
            return 1;
        }
        [task waitUntilExit];

        if (task.terminationStatus != 0) {
            NSString *errMsg = errData ? [[NSString alloc] initWithData:errData encoding:NSUTF8StringEncoding] : nil;
            errMsg = [errMsg stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
            showError(@"MarkPaste Error", errMsg.length > 0 ? errMsg : @"MarkPaste failed with an unknown error.");
            return 1;
        }

        NSDictionary *outputObj = outData ? [NSJSONSerialization JSONObjectWithData:outData options:0 error:&jsonError] : nil;
        NSString *outHtml = [outputObj[@"html"] isKindOfClass:NSString.class] ? outputObj[@"html"] : nil;
        NSString *outMarkdown = [outputObj[@"markdown"] isKindOfClass:NSString.class] ? outputObj[@"markdown"] : nil;
        if (!outHtml || !outMarkdown) {
            showError(@"MarkPaste Error", jsonError.localizedDescription ?: @"Invalid output from markpaste.");
            return 1;
        }

        NSPasteboardItem *item = [[NSPasteboardItem alloc] init];
        [item setString:outHtml forType:NSPasteboardTypeHTML];
        [item setString:outMarkdown forType:NSPasteboardTypeString];
        [pb clearContents];
        [pb writeObjects:@[item]];
    }

    return 0;
}
