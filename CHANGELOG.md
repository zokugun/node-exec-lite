Changelog
=========

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][keepachangelog], and this project adheres to [Semantic Versioning][semver].

[Unreleased]
------------

### Changed

- rename `all` property to `merged`

### Added

- add `args` and `cwd` informations to result
- add `resultMode` option. So when its `merged`, `exec` returns only the `merged` output
- add `createCommand` function to generate helper to run pre-defined command

[v0.2.0] | 2026-11-11
---------------------

### Breaking

- rename project

[v0.1.0] | 2026-11-07
---------------------

### Added

- initial release

[keepachangelog]: https://keepachangelog.com/en/2.0.0/
[semver]: https://semver.org/spec/v2.0.0.html
[unreleased]: https://github.com/zokugun/node-exec-lite/compare/v0.2.0...HEAD
[v0.2.0]: https://github.com/zokugun/node-exec-lite/releases/tag/v0.2.0
[v0.1.0]: https://github.com/zokugun/node-exec-lite/releases/tag/v0.1.0
