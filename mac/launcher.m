#import <AppKit/AppKit.h>
#import <limits.h>
#import <mach-o/dyld.h>
#import <stdio.h>
#import <stdlib.h>
#import <unistd.h>

static void showError(NSString *title, NSString *message) {
    fprintf(stderr, "%s: %s\n", [title UTF8String], [message UTF8String]);
    if (getenv("MP_NO_DIALOG") != NULL) {
        return;
    }

    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [NSApp activateIgnoringOtherApps:YES];

    NSAlert *alert = [[NSAlert alloc] init];
    alert.alertStyle = NSAlertStyleCritical;
    alert.messageText = title;
    alert.informativeText = message;
    [alert addButtonWithTitle:@"OK"];
    [alert runModal];
}

static NSString *resolveBundleScriptPath(void) {
    char exePath[PATH_MAX];
    uint32_t size = sizeof(exePath);
    if (_NSGetExecutablePath(exePath, &size) != 0) {
        return nil;
    }

    char resolved[PATH_MAX];
    if (realpath(exePath, resolved) == NULL) {
        return nil;
    }

    NSString *exeStr = [NSFileManager.defaultManager stringWithFileSystemRepresentation:resolved length:strlen(resolved)];
    NSString *contentsDir = [[exeStr stringByDeletingLastPathComponent] stringByDeletingLastPathComponent];
    return [contentsDir stringByAppendingPathComponent:@"Resources/markpaste.mjs"];
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
    NSData *htmlData = [pb dataForType:NSPasteboardTypeHTML];
    if (htmlData.length == 0) {
        return nil;
    }
    NSString *html = [[NSString alloc] initWithData:htmlData encoding:NSUTF8StringEncoding];
    if (!html) {
        html = [[NSString alloc] initWithData:htmlData encoding:NSWindowsCP1252StringEncoding];
    }
    return html;
}

int main(int argc, const char *argv[]) {
    (void)argc;
    (void)argv;

    @autoreleasepool {
        NSString *scriptPath = resolveBundleScriptPath();
        if (!scriptPath || ![NSFileManager.defaultManager isReadableFileAtPath:scriptPath]) {
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
        NSCharacterSet *ws = [NSCharacterSet whitespaceAndNewlineCharacterSet];
        NSString *rawHtml = readHtmlFromPasteboard(pb);
        BOOL hasHtml = rawHtml && [rawHtml stringByTrimmingCharactersInSet:ws].length > 0;
        if (!hasHtml) rawHtml = nil;

        NSString *rawText = hasHtml ? nil : [pb stringForType:NSPasteboardTypeString];
        BOOL hasText = rawText && [rawText stringByTrimmingCharactersInSet:ws].length > 0;
        if (!hasHtml && !hasText) {
            showError(@"MarkPaste Error", @"No content found in clipboard.");
            return 1;
        }

        NSDictionary *inputObj = @{
            @"html": rawHtml ?: [NSNull null],
            @"text": rawText ?: [NSNull null],
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
            [writer writeData:stdinData];
            [writer closeFile];
        });
        dispatch_group_async(group, q, ^{
            outData = [outPipe.fileHandleForReading readDataToEndOfFile];
        });
        dispatch_group_async(group, q, ^{
            errData = [errPipe.fileHandleForReading readDataToEndOfFile];
        });

        dispatch_group_wait(group, DISPATCH_TIME_FOREVER);
        [task waitUntilExit];

        if (task.terminationStatus != 0) {
            NSString *errMsg = [[NSString alloc] initWithData:errData encoding:NSUTF8StringEncoding];
            errMsg = [errMsg stringByTrimmingCharactersInSet:ws];
            showError(@"MarkPaste Error", errMsg.length > 0 ? errMsg : @"MarkPaste failed with an unknown error.");
            return 1;
        }

        NSDictionary *outputObj = [NSJSONSerialization JSONObjectWithData:outData options:0 error:&jsonError];
        NSString *outHtml = [outputObj[@"html"] isKindOfClass:NSString.class] ? outputObj[@"html"] : nil;
        NSString *outMarkdown = [outputObj[@"markdown"] isKindOfClass:NSString.class] ? outputObj[@"markdown"] : nil;
        if (!outHtml || !outMarkdown) {
            showError(@"MarkPaste Error", jsonError.localizedDescription ?: @"Invalid output from markpaste.");
            return 1;
        }

        [pb clearContents];
        [pb setString:outHtml forType:NSPasteboardTypeHTML];
        [pb setString:outMarkdown forType:NSPasteboardTypeString];
    }

    return 0;
}
