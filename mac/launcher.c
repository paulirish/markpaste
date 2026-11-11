#include <limits.h>
#include <mach-o/dyld.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
    char exe_path[PATH_MAX];
    uint32_t size = sizeof(exe_path);
    if (_NSGetExecutablePath(exe_path, &size) != 0) {
        fprintf(stderr, "Error: Buffer too small for executable path.\n");
        return 1;
    }

    char contents_dir[PATH_MAX];
    if (realpath(exe_path, contents_dir) == NULL) {
        perror("realpath");
        return 1;
    }

    // Strip "/MacOS/<exe>" to get ".../Contents"
    for (int i = 0; i < 2; i++) {
        char *slash = strrchr(contents_dir, '/');
        if (!slash) {
            fprintf(stderr, "Error: Invalid bundle path.\n");
            return 1;
        }
        *slash = '\0';
    }

    char script_path[PATH_MAX];
    int written = snprintf(script_path, sizeof(script_path), "%s/Resources/run.sh", contents_dir);
    if (written < 0 || (size_t)written >= sizeof(script_path)) {
        fprintf(stderr, "Error: Script path too long.\n");
        return 1;
    }

    if (access(script_path, F_OK) != 0) {
        fprintf(stderr, "Error: Cannot find %s\n", script_path);
        return 1;
    }

    char **new_argv = malloc((size_t)(argc + 2) * sizeof(char *));
    if (!new_argv) {
        perror("malloc");
        return 1;
    }
    new_argv[0] = "/bin/bash";
    new_argv[1] = script_path;
    for (int i = 1; i < argc; i++) {
        new_argv[i + 1] = argv[i];
    }
    new_argv[argc + 1] = NULL;

    execv("/bin/bash", new_argv);
    perror("execv failed");
    free(new_argv);
    return 1;
}
