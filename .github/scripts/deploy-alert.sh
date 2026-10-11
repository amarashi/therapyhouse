#!/usr/bin/env bash
# Tells the developer when a deploy fails, and tidies up when it recovers.
#
# CMS saves are committed by a GitHub App, and GitHub only emails the person
# who pushed a broken commit — so a failed deploy from the CMS reaches nobody.
# This keeps one open issue labelled `build-failure`, assigned to the
# developer: a failed run opens it (or adds a comment if it is already open),
# and the next successful run closes it. Run by the `report` job in
# .github/workflows/deploy.yml; everything comes in through the environment.
#
#   OUTCOME      success | failure — the whole deploy, build and publish
#   FAILED_STEP  plain-words name of the step that failed (failure only)
#   LOG_DIR      folder holding test.log / build.log from the build job
#   RUN_URL      link to this workflow run
#   SHA, BEFORE  the commit deployed, and the one main pointed at before the push
#   GH_REPO, GH_TOKEN  read by the gh CLI itself
set -euo pipefail

label=build-failure
assignee=amarashi
short_sha=${SHA:0:7}

open_issues() {
  gh issue list --label "$label" --state open --json number --jq '.[].number'
}

if [ "$OUTCOME" = success ]; then
  for n in $(open_issues); do
    gh issue close "$n" --comment "The site built and published successfully again with commit $short_sha, so this is fixed. Run: $RUN_URL"
  done
  exit 0
fi

# --- What was pushed ------------------------------------------------------
# A push can carry several commits; compare against the commit before the
# push so every one of them, and every file they touched, is listed. A manual
# run (or a brand-new branch, where BEFORE is all zeros) has no "before", so
# fall back to the single commit being deployed.
if [ -n "${BEFORE:-}" ] && [ "${BEFORE//0/}" != "" ]; then
  api="repos/{owner}/{repo}/compare/$BEFORE...$SHA"
  commits_jq='.commits[]'
else
  api="repos/{owner}/{repo}/commits/$SHA"
  commits_jq='.'
fi
commits=$(gh api "$api" --jq "$commits_jq"' | "- \(.sha[0:7]) by **\(.commit.author.name)**\(if .author.login then " (@" + .author.login + ")" else "" end): \(.commit.message | split("\n")[0])"')
files=$(gh api "$api" --jq '[.files[]? | "- `\(.filename)` (\(.status))"] | if length == 0 then "- (GitHub did not list any files)" else .[:100] | join("\n") end')

# --- What went wrong ------------------------------------------------------
# Strips colour codes so the log reads cleanly inside the issue.
clean() { sed -e 's/\x1b\[[0-9;]*[A-Za-z]//g' "$1"; }

failing_tests=""
log_tail=""
log_name=""
case "$FAILED_STEP" in
  *"pnpm test"*) log_name=test.log ;;
  *"pnpm build"*) log_name=build.log ;;
esac

if [ "$log_name" = test.log ] && [ -f "$LOG_DIR/test.log" ]; then
  # node --test ends with a "failing tests:" section: a "test at <file:line>"
  # line, then "✖ <name> (<time>)", for each failed test.
  failing_tests=$(clean "$LOG_DIR/test.log" | awk '
    /^✖ failing tests:/ { on = 1; next }
    on && /^test at / { where = substr($0, 9); next }
    on && /^✖ / {
      name = $0; sub(/^✖ /, "", name); sub(/ \([0-9.]+m?s\)$/, "", name)
      print "- " name (where ? " — `" where "`" : ""); where = ""
    }')
fi
if [ -n "$log_name" ] && [ -f "$LOG_DIR/$log_name" ]; then
  log_tail=$(clean "$LOG_DIR/$log_name" | tail -n 80)
fi

# --- Write it up ----------------------------------------------------------
{
  echo "The website was **not** updated. The last working version is still live."
  echo
  echo "**Step that failed:** $FAILED_STEP"
  echo
  echo "**Commits in this deploy** (who made them, and their message):"
  echo "$commits"
  echo
  echo "**Files changed:**"
  echo "$files"
  echo
  if [ -n "$failing_tests" ]; then
    echo "**Failing tests:**"
    echo "$failing_tests"
    echo
  fi
  if [ -n "$log_tail" ]; then
    echo "**Last part of the log** (\`$log_name\`):"
    echo
    echo '~~~~text'
    echo "$log_tail"
    echo '~~~~'
    echo
  fi
  echo "**Full run:** $RUN_URL"
  echo
  echo "This issue closes itself when a later deploy succeeds."
} > body.md

gh label create "$label" --color B60205 \
  --description "A deploy of main failed; closed automatically when one succeeds" --force

existing=$(open_issues | head -n 1)
if [ -n "$existing" ]; then
  gh issue comment "$existing" --body-file body.md
else
  gh issue create --title "Deploy failed: $FAILED_STEP ($short_sha)" \
    --label "$label" --assignee "$assignee" --body-file body.md
fi
