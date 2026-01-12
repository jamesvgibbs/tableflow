#!/bin/bash
# PostToolUse hook: Contextual feedback after file edits for the project
# Provides project-specific guidance based on which files were modified

set -e

# Read JSON input from stdin
INPUT=$(cat)

# Extract the file path from tool_input
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//' || true)

# Skip if no file path found
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Get file extension and relative path
EXT="${FILE_PATH##*.}"
FILENAME="${FILE_PATH##*/}"

# =============================================================================
# PROJECT-SPECIFIC FILE CONTEXT
# =============================================================================

# Convex schema changes
if [[ "$FILE_PATH" =~ convex/schema\.ts ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Convex schema modified. Run 'pnpm generate' to regenerate types. Remember: use indexes with withIndex() instead of filter()."
  }
}
EOF
  exit 0
fi

# Convex functions (queries, mutations, actions)
if [[ "$FILE_PATH" =~ src/convex/.*\.ts$ ]] && [[ ! "$FILE_PATH" =~ _generated ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Convex function modified. Ensure: (1) explicit args and returns validators, (2) use v.null() for functions returning nothing, (3) use withIndex() not filter(). See docs/convex_rules.md for patterns."
  }
}
EOF
  exit 0
fi

# Auth-related files
if [[ "$FILE_PATH" =~ auth-client\.ts|auth-server\.ts|auth-session\.ts|auth\.ts ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Authentication file modified. This project uses Better Auth with email OTP. Server: use requireServerAuth() or getServerSession(). Client: use authClient and useSession() hook."
  }
}
EOF
  exit 0
fi

# Protected route layouts
if [[ "$FILE_PATH" =~ app/\(auth\)/.*layout\.tsx ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Protected route layout modified. Authentication is enforced via getServerSession(). Unauthenticated users redirect to /login?redirect=<path>."
  }
}
EOF
  exit 0
fi

# UI components (shadcn)
if [[ "$FILE_PATH" =~ components/ui/.*\.tsx ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "UI component modified. This project uses shadcn/ui (new-york style) with Radix UI primitives. Use cn() from @/lib/utils for conditional classes."
  }
}
EOF
  exit 0
fi

# Global CSS / TailwindCSS
if [[ "$FILE_PATH" =~ globals\.css$ ]] || [[ "$EXT" == "css" ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "CSS file modified. This project uses TailwindCSS v4 with CSS-first configuration. CSS variables are enabled for theming. No tailwind.config.js needed."
  }
}
EOF
  exit 0
fi

# TypeScript/JavaScript in src/
if [[ "$FILE_PATH" =~ ^.*/src/.*\.(ts|tsx|js|jsx)$ ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "TypeScript file modified. Run 'pnpm lint' to check for issues. Remember: Server Components by default, only add 'use client' when needed for interactivity."
  }
}
EOF
  exit 0
fi

# Package.json changes
if [[ "$FILENAME" == "package.json" ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "package.json modified. Run 'pnpm install' to sync dependencies. Update docs/TECH_STACK.md if adding significant new dependencies."
  }
}
EOF
  exit 0
fi

# Environment files
if [[ "$FILENAME" =~ ^\.env ]]; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Environment file modified. Never commit .env.local. Required vars: CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CONVEX_SITE_URL, SITE_URL. For production: add RESEND_API_KEY."
  }
}
EOF
  exit 0
fi

exit 0