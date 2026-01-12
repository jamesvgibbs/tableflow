# Fix Issues Command

Execute fixes from the current fix plan. Can fix all issues, specific issues by number, or issues by priority.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format        | Example                 |
| ------------- | ------------- | ----------------------- |
| Issue numbers | `#N`          | `#1`, `#3`, `#5`        |
| Flags         | `--flag-name` | `--critical`, `--major` |

**Supported Flags:**

- `--critical` - Fix only 🔴 critical issues
- `--major` - Fix 🔴 critical and 🟡 major issues
- `--minor` - Fix all including 🟢 minor issues
- `--stop-on-error` - Stop execution if a fix fails

**Issue Number Format:**

- Must start with `#` followed by a number (e.g., `#1`, `#12`)
- Multiple issue numbers can be specified: `#1 #3 #5`

**Error Handling:**

- If issue number format is wrong (e.g., `1` instead of `#1`), warn: "Invalid issue format '1'. Use '#1' format."
- If flag is unrecognized (e.g., `--crit`), warn: "Unknown flag '[flag]'. Did you mean '--critical'?"
- Unrecognized arguments should be ignored with a warning

## Usage Examples

```bash
/fix-issues              # Fix all issues in priority order
/fix-issues #1           # Fix only issue #1
/fix-issues #1 #3 #5     # Fix specific issues
/fix-issues --critical   # Fix only critical issues
/fix-issues --major      # Fix critical and major issues
```

## Instructions

### Error Handling

**Git/GH Operation Failures:**

- **Typecheck fails**: Report specific errors and continue to next issue (unless `--stop-on-error`)
- **File not found**: If file from plan doesn't exist, mark issue as "⚠️ File missing" and skip
- **Edit conflicts**: If file has changed significantly since plan was created, warn user and ask for confirmation
- **Test failures**: Report failing tests but don't mark issue as failed if the fix itself was applied

### Step 1: Locate the Plan File

Find the most recent plan file:

```bash
ls -t .claude/plans/fix-plan-*.md | head -1
```

If no plan file exists, inform the user:

> "No fix plan found. Run `/fix-plan` first to create a remediation plan from your code review."

### Step 2: Parse Arguments

| Argument     | Action                       |
| ------------ | ---------------------------- |
| (none)       | Fix all issues in order      |
| `#N`         | Fix only issue N             |
| `#N #M #O`   | Fix multiple specific issues |
| `--critical` | Fix only 🔴 critical issues  |
| `--major`    | Fix 🔴 critical and 🟡 major |
| `--minor`    | Fix all including 🟢 minor   |

### Step 3: Read the Plan

Parse the plan file to extract:

- Issue numbers
- File paths and line numbers
- Problem descriptions
- Suggested fixes
- Dependencies between issues

### Step 4: Respect Dependencies

Before fixing an issue, check if it depends on another issue that hasn't been fixed yet.

If dependencies exist:

> "Issue #3 depends on #1 which hasn't been fixed yet. Would you like me to fix #1 first?"

### Step 5: Fix Each Issue

For each issue to fix:

1. **Announce**: "Fixing issue #N: [title]"

2. **Update TodoWrite**: Mark the issue as `in_progress`

3. **Read the file**: Load the file mentioned in the issue

4. **Apply the fix**: Use Edit tool to make the changes

5. **Verify**:
   - Run `npx tsc --noEmit` to check for type errors
   - If tests are affected, run relevant tests

6. **Update the plan file**: Change status from `⬜ Not started` to `✅ Complete`

7. **Update TodoWrite**: Mark the issue as `completed`

8. **Report**:
   ```
   ✅ Fixed issue #N: [title]
   - File: src/path/to/file.ts
   - Changes: [brief description]
   ```

### Step 6: Handle Failures

If a fix cannot be applied:

1. **Report the problem**:

   ```
   ❌ Could not fix issue #N: [title]
   - Reason: [why it failed]
   - Manual action needed: [what the user should do]
   ```

2. **Update plan file**: Change status to `⚠️ Needs attention`

3. **Continue to next issue** (unless `--stop-on-error` flag)

### Step 7: Summary Report

After all fixes are attempted:

```markdown
## Fix Issues Summary

### Completed

- ✅ #1: [title]
- ✅ #3: [title]

### Failed (needs manual attention)

- ❌ #2: [title] - [reason]

### Remaining

- ⬜ #4: [title]
- ⬜ #5: [title]

### Verification

- TypeScript: ✅ No errors
- Tests: ✅ All passing (or ⚠️ X failures)

### Next Steps

- Run `/fix-issues #4 #5` to continue
- Or run `/code-review` to verify all issues are resolved
```

### Step 8: Update Plan File Progress Table

Update the progress tracking table in the plan file:

```markdown
## Progress Tracking

| Issue | Status         | Completed        |
| ----- | -------------- | ---------------- |
| #1    | ✅ Complete    | 2024-12-17 09:30 |
| #2    | ❌ Failed      | -                |
| #3    | ✅ Complete    | 2024-12-17 09:32 |
| #4    | ⬜ Not started | -                |
```

## Safety Guidelines

### Pre-Fix Safety Checklist

Before running `/fix-issues`, ensure your working directory is in a recoverable state:

```bash
# Option 1: Create a checkpoint commit (recommended if you want to push)
git add -A && git commit -m "checkpoint: before fix-issues" && git push

# Option 2: Stash current changes (for local-only recovery)
git stash push -m "before fix-issues"

# Option 3: Check current PR status before making changes
gh pr status
```

⚠️ **Warning**: This command modifies files directly. If fixes fail partway through:

- Use `gh pr diff` or `git diff` to review all changes made
- Use `git checkout -- <file>` to revert specific files
- Use `git checkout -- .` to revert all changes
- Use `git stash pop` to restore stashed changes

### During Execution

1. **Never auto-commit**: Fixes are made to working directory only
2. **Preserve behavior**: Fixes should not change intended functionality
3. **Run verification**: Always typecheck after fixes
4. **One at a time**: Fix issues sequentially, verify between each
5. **Respect scope**: Only modify code related to the specific issue

## Complexity Handling

| Complexity   | Approach                                  |
| ------------ | ----------------------------------------- |
| **Quick**    | Apply fix directly                        |
| **Moderate** | Apply fix, run tests                      |
| **Complex**  | Ask user for confirmation before applying |

For complex issues:

> "Issue #5 is complex and involves changes to 4 files. Would you like me to:
>
> 1. Proceed with the fix
> 2. Show you the planned changes first
> 3. Skip for now"
