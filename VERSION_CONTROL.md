# WeatherQ — Version Control Guide

## Branch Structure

```
main        ← production-ready code, tagged releases only
develop     ← staging / integration of finished features
feature/*   ← one branch per feature, merged into develop
hotfix/*    ← urgent fixes branched from main, merged back to main + develop
```

## Starting a new feature

```bash
git checkout develop
git checkout -b feature/your-feature-name

# ... build the feature ...

git add .
git commit -m "feat: description"
git checkout develop
git merge --no-ff feature/your-feature-name
git branch -d feature/your-feature-name
```

## Releasing a new version

```bash
# 1. Merge develop into main
git checkout main
git merge --no-ff develop

# 2. Bump version in app.json  (e.g. "1.1.0")
# 3. Update CHANGELOG.md

# 4. Commit the release
git add app.json CHANGELOG.md
git commit -m "chore: release v1.1.0"

# 5. Tag it
git tag -a v1.1.0 -m "WeatherQ v1.1.0 — short description"

# 6. Push everything
git push origin main develop --tags

# 7. Build on EAS
npx eas-cli@latest build --profile production --platform android
```

## Rolling back to a previous version

```bash
# Option A — check out a tag (read-only, no commits)
git checkout v1.0.0

# Option B — create a hotfix branch from a tag
git checkout -b hotfix/rollback-to-v1.0.0 v1.0.0

# Option C — hard reset main to a tag (destructive — push with care)
git checkout main
git reset --hard v1.0.0
git push --force-with-lease origin main   # only if truly needed
```

## Urgent hotfix (production bug)

```bash
git checkout main
git checkout -b hotfix/fix-description

# ... fix the bug ...

git commit -m "fix: description of the fix"

# Merge into both main AND develop
git checkout main
git merge --no-ff hotfix/fix-description
git tag -a v1.0.1 -m "Hotfix v1.0.1"

git checkout develop
git merge --no-ff hotfix/fix-description
git branch -d hotfix/fix-description
```

## Viewing history

```bash
git log --oneline --graph --all    # visual branch graph
git tag -l                          # list all version tags
git show v1.0.0                     # details of a specific tag
git diff v1.0.0 v1.1.0             # what changed between versions
```

## Current versions

| Tag    | Date       | EAS Build |
|--------|------------|-----------|
| v1.0.0 | 2026-05-21 | expo.dev/artifacts/eas/9DmmyPbdzCZ8Luym4kKBoS.aab |
