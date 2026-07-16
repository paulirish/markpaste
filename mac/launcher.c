#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <limits.h>
#include <mach-o/dyld.h>

int main(int argc, char *argv[]) {
    char exe_path[PATH_MAX];
    uint32_t size = sizeof(exe_path);
    
    if (_NSGetExecutablePath(exe_path, &size) != 0) {
        fprintf(stderr, "Error: Buffer too small for executable path.\n");
        return 1;
    }
    
    // Resolve real path to handle symlinks
    char real_exe_path[PATH_MAX];
    if (realpath(exe_path, real_exe_path) == NULL) {
        perror("realpath");
        return 1;
    }
    
    // Get the directory of the executable
    char *last_slash = strrchr(real_exe_path, '/');
    if (!last_slash) {
        fprintf(stderr, "Error: Invalid executable path.\n");
        return 1;
    }
    *last_slash = '\0'; // real_exe_path is now the directory (.../Contents/MacOS)
    
    // We want to run run.sh in the same directory, or in Resources.
    // Let's look for run.sh in the same directory first.
    char script_path[PATH_MAX];
    snprintf(script_path, sizeof(script_path), "%s/run.sh", real_exe_path);
    
    // Check if run.sh exists there, if not try Resources
    if (access(script_path, F_OK) != 0) {
        // Try .../Contents/Resources/run.sh
        // Go up one level from MacOS
        *last_slash = '\0'; // wait, we already set *last_slash to \0. 
        // Let's find the new last slash
        char *prev_slash = strrchr(real_exe_path, '/');
        if (prev_slash) {
            *prev_slash = '\0'; // real_exe_path is now .../Contents
            snprintf(script_path, sizeof(script_path), "%s/Resources/run.sh", real_exe_path);
        }
    }
    
    // Check if script exists
    if (access(script_path, F_OK) != 0) {
        fprintf(stderr, "Error: Cannot find run.sh\n");
        return 1;
    }
    
    // Execute: /bin/bash <script_path> <arguments...>
    // Prepare arguments for execv
    char **new_argv = malloc((argc + 2) * sizeof(char *));
    new_argv[0] = "/bin/bash";
    new_argv[1] = script_path;
    for (int i = 1; i < argc; i++) {
        new_argv[i + 1] = argv[i];
    }
    new_argv[argc + 1] = NULL;
    
    execv("/bin/bash", new_argv);
    
    // If execv returns, it failed
    perror("execv failed");
    free(new_argv);
    return 1;
}
