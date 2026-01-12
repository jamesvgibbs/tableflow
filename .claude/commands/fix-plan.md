# Fix Plan Command

Create a prioritized remediation plan from the most recent code review findings.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format        | Example        |
| ------------- | ------------- | -------------- |
| Flags         | `--flag-name` | `--post-to-pr` |

**Supported Flags:**

- `--post-to-pr` - Post the fix plan summary as a comment on the current PR

**Error Handling:**

- If argument looks like a flag but is unrecognized (e.g., `--postpr`), warn: "Unknown flag '[flag]'. Did you mean '--post-to-pr'?"
- Unrecognized arguments should be ignored with a warning

## Instructions

### Step 0: Parse Arguments

Check if `--post-to-pr` is present in the arguments. If so, the plan will be posted to the PR after creation.

### Step 1: Gather Review Context

If no review context is provided in the arguments, ask the user:

- "Would you like me to run `/code-review` first, or do you have review findings to share?"

If review findings exist from the current conversation, use those.

### Step 2: Verify Prerequisites & Get Branch Information

```bash
# Check if gh CLI is installed (recommended for faster operations)
gh --version
```

**Error Handling for Git/GH Operations:**

- **gh auth failure**: If `gh` fails due to auth, suggest: "Run `gh auth login` to authenticate."
- **No PR exists**: When `gh pr view` fails, fall back to git commands and note: "No PR found. Using local git branch."
- **Git failures**: Report clearly: "Git operation failed: [error]. Ensure you're in a valid git repository."
- **Empty review context**: If no review findings provided, prompt user rather than generating empty plan.

If `gh` is not installed, inform the user:

> "GitHub CLI (`gh`) is not installed. For faster operations, install it via:
>
> - macOS: `brew install gh`
> - Other: https://cli.github.com/"

```bash
# Get current branch name (gh if PR exists, otherwise git)
gh pr view --json headRefName -q '.headRefName' 2>/dev/null || git branch --show-current
```

### Step 3: Create the Plan File

Create a markdown file at: `.claude/plans/fix-plan-[branch-name]-[YYYY-MM-DD].md`

Use this format:

````markdown
# Fix Plan – [branch-name]

**Created**: [date]
**Review Source**: Code review from [date/time]
**Total Issues**: X critical, Y major, Z minor

---

## Execution Order

Issues are ordered by: Priority (critical → major) then dependency (foundational fixes first).

---

## 🔴 Critical Issues

### Issue #1: [Brief Title]

**File**: `src/path/to/file.ts:line`
**Area**: Security | Convex | Frontend | Performance | Code Quality | Type Safety | Tests
**Complexity**: Quick | Moderate | Complex

**Problem**:
[1-2 sentence description of why this is a problem]

**Fix**:
[Specific action to take]

**Code Context**:

```typescript
// Relevant code snippet showing the problem
```
````

**Suggested Change**:

```typescript
// How the code should look after the fix
```

- [ ] Not started

---

### Issue #2: [Brief Title]

...

---

## 🟡 Major Issues

### Issue #3: [Brief Title]

...

---

## 🟢 Minor Issues (Optional)

### Issue #N: [Brief Title]

...

---

## Dependencies

Some fixes depend on others. Recommended order:

1. **#1** → (no dependencies)
2. **#3** → depends on **#1**
3. **#2** → (no dependencies, can be done in parallel with #3)

---

## Progress Tracking

| Issue | Status         | Completed |
| ----- | -------------- | --------- |
| #1    | ⬜ Not started | -         |
| #2    | ⬜ Not started | -         |
| #3    | ⬜ Not started | -         |

**Status Legend**: ⬜ Not started | 🔄 In progress | ✅ Complete | ⏭️ Skipped

---

## Commands

To fix issues from this plan:

- Fix all: `/fix-issues`
- Fix specific: `/fix-issues #1`
- Fix by priority: `/fix-issues --critical` or `/fix-issues --major`

```

### Step 4: Sync with TodoWrite

After creating the plan file, also add the issues to the TodoWrite tool so progress is tracked in the conversation:

```

TodoWrite with items:

- Fix critical issue #1: [title]
- Fix critical issue #2: [title]
- Fix major issue #3: [title]
  ...

```

### Step 5: Confirm with User

After creating the plan, output:

```

## Fix Plan Created

📄 **Plan file**: `.claude/plans/fix-plan-[branch]-[date].md`

### Summary

- 🔴 X critical issues
- 🟡 Y major issues
- 🟢 Z minor issues

### Recommended Next Steps

1. Review the plan file for accuracy
2. Run `/fix-issues` to start fixing (or `/fix-issues #1` for specific issue)
3. Plan will be updated as issues are resolved

**To share with your team:** Run `/fix-plan --post-to-pr` to post this checklist to the PR.

Would you like me to start fixing issues now?

````

### Step 6: Post to PR (if `--post-to-pr` flag)

If the `--post-to-pr` flag was provided:

#### 6a: Check for existing PR

```bash
# Get current PR number (fails if no PR exists)
gh pr view --json number -q '.number'
````

If no PR exists, inform the user:

> "No open PR found for this branch. Create a PR first with `gh pr create`, then re-run with `--post-to-pr`."

#### 6b: Check for existing fix-plan comment

```bash
# Look for existing fix-plan comment to update
gh pr view --json comments -q '.comments[] | select(.body | contains("<!-- fix-plan-marker -->")) | .id' | head -1
```

#### 6c: Post or update the comment

Use the **Summary + Checklist** format below. If an existing comment was found, update it; otherwise create a new one.

```bash
# Create new comment
gh pr comment --body "$(cat <<'EOF'
<!-- fix-plan-marker -->
## 🔍 Code Review Fix Plan

**Branch**: `[branch-name]`
**Generated**: [date]
**Found**: X critical, Y major, Z minor issues

---

### Action Checklist

#### 🔴 Critical (must fix)

- [ ] #1: [Brief title] - `file.ts:line`
- [ ] #2: [Brief title] - `file.ts:line`

#### 🟡 Major (should fix)

- [ ] #3: [Brief title] - `file.ts:line`
- [ ] #4: [Brief title] - `file.ts:line`

#### 🟢 Minor (consider)

- [ ] #5: [Brief title] - `file.ts:line`

---

<details>
<summary>📄 View Full Fix Plan</summary>

[Include the full plan content here, or a link to the plan file]

</details>

---

*🤖 Generated by Claude Code Review*
EOF
)"
```

To update an existing comment:

```bash
gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH -f body="[updated content]"
```

#### 6d: Confirm posting

After posting, output:

```
✅ **Fix plan posted to PR**

🔗 [View PR comment](PR_URL)

The checklist is now visible on the PR. Engineers can check off items as they're completed.
```

## Complexity Guidelines

| Complexity   | Criteria                                            |
| ------------ | --------------------------------------------------- |
| **Quick**    | Single file, < 10 lines changed, no tests needed    |
| **Moderate** | 1-3 files, may need test updates, straightforward   |
| **Complex**  | Multiple files, architectural changes, tests needed |

## Dependency Detection

Look for dependencies between issues:

- If fixing issue A requires code that issue B will change, B should come first
- If issues are in the same file, group them
- Security issues often should be fixed first (they may affect other code)

## Plan File Maintenance

Old plan files accumulate in `.claude/plans/`. Periodically clean up:

```bash
# Remove plan files older than 30 days
find .claude/plans -name "fix-plan-*.md" -mtime +30 -delete
```
