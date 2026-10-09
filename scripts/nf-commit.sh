#!/usr/bin/env bash
# ============================================================================
# nf-commit.sh - concurrency-safe commit helper for NF repos.
#
# Commits ONLY the paths you name, even when another agent session has staged
# other files. This is the concrete countermeasure to the incident recorded in
# docs/technical/improvement-log.md (2026-09-13 and 2026-09-15): two agents
# working in the same repo, one running `git add -A`/`git commit`, silently
# absorbing the other's staged work under its own commit message.
#
# Usage:
#   scripts/nf-commit.sh -m "fix: ..." path/to/a.ts path/to/b.md
#   scripts/nf-commit.sh --message "docs: ..." docs/technical/x.md
#
# Why it is safe: `git commit -- <paths>` builds a temporary index from those
# paths only. Any other staged change stays in the index, untouched, for its own
# owner to commit later.
#
# The helper also takes an advisory lock (`.git/nf-agent.lock`) so two runs do
# not overlap. A stale lock (older than NF_LOCK_TTL seconds, default 1200) is
# stolen with a warning.
#
# Never use this to bypass hooks: it always runs the normal pre-commit hook.
#
# Flags:
#   -m, --message <msg>   commit message (required)
#   -n, --dry-run         print the exact git command without running it
#   -h, --help            this help
# ============================================================================
set -euo pipefail

MESSAGE=""
DRY_RUN=false
PATHS=()

usage() {
  sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message) MESSAGE="${2:-}"; shift 2 ;;
    -n|--dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    --) shift; while [[ $# -gt 0 ]]; do PATHS+=("$1"); shift; done ;;
    -*) echo "error: unknown option: $1" >&2; exit 2 ;;
    *) PATHS+=("$1"); shift ;;
  esac
done

if [[ -z "$MESSAGE" ]]; then
  echo "error: -m/--message is required." >&2
  exit 2
fi
if [[ "${#PATHS[@]}" -eq 0 ]]; then
  echo "error: at least one path is required." >&2
  echo "       Never commit 'everything' in a shared repo. Name the files you changed." >&2
  exit 2
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: not inside a git repository." >&2
  exit 2
fi

for p in "${PATHS[@]}"; do
  if [[ ! -e "$p" ]] && ! git ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then
    echo "error: path not found and not tracked: $p" >&2
    exit 2
  fi
done

GIT_DIR="$(git rev-parse --git-dir)"
LOCK="$GIT_DIR/nf-agent.lock"
LOCK_TTL="${NF_LOCK_TTL:-1200}"
LOCK_HELD=false

release_lock() {
  if [[ "$LOCK_HELD" == true ]]; then
    rm -rf "$LOCK"
  fi
}
trap release_lock EXIT

acquire_lock() {
  if mkdir "$LOCK" 2>/dev/null; then
    printf '%s' "${NF_AGENT_SESSION:-$$}" > "$LOCK/session"
    date +%s > "$LOCK/time"
    LOCK_HELD=true
    return 0
  fi
  local t now age
  t="$(cat "$LOCK/time" 2>/dev/null || echo 0)"
  now="$(date +%s)"
  age=$(( now - t ))
  if [[ "$age" -gt "$LOCK_TTL" ]]; then
    echo "warn: stealing stale nf-agent lock (age ${age}s > ${LOCK_TTL}s)." >&2
    rm -rf "$LOCK"
    acquire_lock
    return 0
  fi
  echo "error: another NF agent commit holds the lock: $LOCK (age ${age}s)." >&2
  echo "       Wait, or remove it if you know it is stale." >&2
  exit 1
}

acquire_lock

if [[ "$DRY_RUN" == true ]]; then
  echo "dry-run: git commit -m <message> -- ${PATHS[*]}"
  exit 0
fi

# Stage exactly these paths (covers new files and deletions). `git commit --`
# then records only them and leaves any other staged work untouched.
#
# Fallback encountered 2026-10-08: `git add -A -- <path>` FAILS on a path that is
# tracked but sits inside an ignored directory (here quest-hunt-web/
# tools/asset-generator, ignored by the root .gitignore while its .gitignore file
# is tracked). Git prints advice and returns non-zero, so the whole commit
# aborted. `git add -u` stages modifications and deletions of ALREADY TRACKED
# files only, which is exactly what is needed here and never adds an ignored
# untracked file.
if ! git add -A -- "${PATHS[@]}" 2>/dev/null; then
  echo "  [nf-commit] git add -A refused a path (tracked inside an ignored directory?)"
  echo "  [nf-commit] retrying with 'git add -u', which touches tracked files only"
  git add -u -- "${PATHS[@]}"
fi
git commit -m "$MESSAGE" -- "${PATHS[@]}"

# `git commit -- <paths>` records the commit through a temporary index and does
# not update the real one. Every other session therefore keeps seeing the paths
# just committed as phantom staged changes, and a brand new file shows up as a
# STAGED DELETION that a careless `git commit` would apply. Reset only these
# paths, so the index matches the new HEAD while any other staged work stays
# untouched.
git reset -q -- "${PATHS[@]}" 2>/dev/null || true

# Keep the working tree honest: after a commit, the committed paths must match
# HEAD. A `git status` showing them modified again means something else has since
# changed them, which the caller must look at before building on this commit.
if ! git diff --quiet HEAD -- "${PATHS[@]}"; then
  echo "note: ${PATHS[*]} changed again after the commit - inspect with:" >&2
  echo "      git diff HEAD -- ${PATHS[*]}" >&2
fi
