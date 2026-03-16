export default {
    extends: ["@commitlint/config-conventional"],
    rules: {
      "type-enum": [
        2,
        "always",
        ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "ci", "revert"]
      ],
      "subject-case": [2, "always", "lower-case"],
      "subject-max-length": [2, "always", 72],
      "body-max-line-length": [2, "always", 100],
    },
  };
