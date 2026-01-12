#!/bin/bash
# SessionStart hook: Load project context when Claude Code starts
# Provides status about git, dependencies, and backend services

set -e

# Change to project directory
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

echo "=== Project Status ==="
echo ""

# -----------------------------------------------------------------------------
# Git Status
# -----------------------------------------------------------------------------
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  MAIN_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

  # Count uncommitted changes
  STAGED=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
  UNSTAGED=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
  TOTAL=$((STAGED + UNSTAGED + UNTRACKED))

  if [ "$TOTAL" -gt "0" ]; then
    echo "Git: $BRANCH ($TOTAL uncommitted changes)"
  else
    echo "Git: $BRANCH (clean)"
  fi

  # Check if behind/ahead of main
  if [ "$BRANCH" != "$MAIN_BRANCH" ] && git rev-parse origin/"$MAIN_BRANCH" > /dev/null 2>&1; then
    BEHIND=$(git rev-list --count HEAD..origin/"$MAIN_BRANCH" 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt "0" ]; then
      echo "     $BEHIND commits behind $MAIN_BRANCH"
    fi
  fi
fi

# -----------------------------------------------------------------------------
# Dependencies Status
# -----------------------------------------------------------------------------
if [ ! -d "node_modules" ]; then
  echo "Dependencies: node_modules missing - run 'pnpm install'"
elif [ "package.json" -nt "node_modules" ]; then
  echo "Dependencies: may be outdated - consider 'pnpm install'"
else
  echo "Dependencies: installed"
fi

# -----------------------------------------------------------------------------
# Convex Backend Status
# -----------------------------------------------------------------------------
if [ -f ".env.local" ]; then
  if grep -q "CONVEX_DEPLOYMENT" .env.local 2>/dev/null; then
    DEPLOYMENT=$(grep "CONVEX_DEPLOYMENT" .env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "unknown")
    echo "Convex: configured ($DEPLOYMENT)"
  else
    echo "Convex: CONVEX_DEPLOYMENT not set in .env.local"
  fi
else
  echo "Convex: .env.local not found - copy from .env.local.example"
fi

# -----------------------------------------------------------------------------
# Convex Types Status
# -----------------------------------------------------------------------------
if [ -f "src/convex/_generated/api.d.ts" ]; then
  TYPES_AGE=$(find src/convex/_generated/api.d.ts -mmin +60 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TYPES_AGE" -gt "0" ]; then
    echo "Types: may be stale - run 'pnpm generate' if schema changed"
  else
    echo "Types: up to date"
  fi
else
  echo "Types: not generated - run 'pnpm generate'"
fi

# -----------------------------------------------------------------------------
# Quick Reference
# -----------------------------------------------------------------------------
echo ""
echo "Commands: pnpm dev | pnpm lint | pnpm generate | pnpm build"
echo "Docs: CLAUDE.md | docs/TECH_STACK.md | docs/convex_rules.md"

exit 0