# Upstream provenance

- Source: https://github.com/addyosmani/agent-skills/tree/fea75b16472ba87e8c11f13a9e000c3ffdb2d1f5/skills/code-simplification
- Commit: `fea75b16472ba87e8c11f13a9e000c3ffdb2d1f5`
- License: MIT
- Installed as: a project-local Cursor Agent Skill

## Updating

1. Review the upstream `SKILL.md` and repository license at the new immutable commit.
2. Replace the vendored file instead of merging instruction fragments.
3. Inspect the diff for new tools, scripts, autonomous actions, or weakened behavior-preservation rules.
4. Run the skill against an empty or already-clean diff before accepting the update.

The skill is intentionally vendored rather than symlinked or installed globally. Updates require a reviewed repository change.
