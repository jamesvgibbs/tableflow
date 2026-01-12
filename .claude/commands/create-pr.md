# Create Pull Request Command

Create a new branch (if needed), commit changes, and submit a pull request.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format        | Example          |
| ------------- | ------------- | ---------------- |
| Flags         | `--flag-name` | `--draft`        |
| Options       | `--key=value` | `--base=develop` |

**Supported Flags:**

- `--draft` - Create as a draft PR

**Supported Options:**

- `--base=<branch>` - Target branch for the PR (default: `main`)
- `--title=<title>` - Custom PR title

**Error Handling:**

- If argument looks like a flag but is unrecognized, warn: "Unknown flag '[flag]'."
- Unrecognized arguments should be ignored with a warning

## Behavior

1. Checks current branch and working directory status
2. Runs pre-commit checks (`pnpm lint`, `pnpm build`)
3. Analyzes changes and automatically splits into logical commits when appropriate
4. Each commit focuses on a single logical change or feature
5. Creates descriptive commit messages for each logical unit
6. Pushes branch to remote
7. Creates pull request with proper summary and test plan

## Instructions

### Step 1: Verify Prerequisites

```bash
# Check if gh CLI is installed
gh --version
```

If `gh` is not installed, inform the user:

> "GitHub CLI (`gh`) is required. Install it via:
>
> - macOS: `brew install gh`
> - Other: https://cli.github.com/
>
> Then authenticate with `gh auth login`"

### Step 2: Check Current State

```bash
# Get current branch
git branch --show-current

# Check for uncommitted changes
git status --porcelain
```

If on `main` branch, warn:

> "You're on the main branch. Create a feature branch first: `git checkout -b feature/your-feature`"

### Step 3: Run Pre-commit Checks

```bash
pnpm lint
pnpm build
```

If checks fail, ask user:

> "Pre-commit checks failed. Would you like to:
>
> 1. Fix the issues and try again
> 2. Continue anyway (not recommended)"

### Step 4: Analyze Changes and Create Commits

If there are uncommitted changes:

1. Run `git diff` to understand all changes
2. Identify logical groupings of changes
3. For each logical group:
   - Stage relevant files with `git add`
   - Create a commit with descriptive message using emoji convention
4. Push branch to remote with `-u` flag

### Step 5: Create Pull Request

```bash
gh pr create --title "[title]" --body "$(cat <<'EOF'
## Summary

[1-3 bullet points describing the changes]

## Changes

- [List of specific changes]

## Test Plan

- [ ] Tested locally with `pnpm dev`
- [ ] Ran `pnpm lint` - no errors
- [ ] Ran `pnpm build` - builds successfully
- [ ] [Additional manual testing steps]

## Screenshots (if applicable)

[Add screenshots for UI changes]

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Add `--draft` flag if specified.

### Step 6: Confirm Creation

After PR is created, output:

```
✅ **Pull Request Created**

🔗 [View PR](PR_URL)

**Branch**: feature-branch → main
**Title**: [PR title]

Next steps:
1. Review the PR description
2. Request reviewers if needed
3. Monitor CI checks
```

## Guidelines for Automatic Commit Splitting

- Split commits by feature, component, or concern
- Keep related file changes together in the same commit
- Separate refactoring from feature additions
- Separate Convex backend changes from frontend changes
- Ensure each commit can be understood independently
- Multiple unrelated changes should be split into separate commits

## PR Title Guidelines

Generate a clear, descriptive title that:

- Starts with an emoji matching the primary change type
- Uses imperative mood (e.g., "Add" not "Added")
- Is concise but descriptive (50-72 characters)
- Describes the user-facing impact when possible

**Examples:**

- ✨ Add user profile settings page
- 🐛 Fix authentication redirect loop
- ♻️ Refactor dashboard data fetching
- 🔒️ Add rate limiting to auth endpoints
- 🗃️ Add family ecosystem schema and queries
