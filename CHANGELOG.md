# js-grip Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

## [4.0.2] - 2024-03-06

### Fixed

- fix: Fix "types" field in package.json

### Changed

- docs: Write `127.0.0.1` instead of `localhost`

## [4.0.1] - 2024-03-04

### Added

- `parseGripUri` second parameter can have `undefined` values and they will successfully be
  ignored.

## [4.0.0] - 2024-03-01
- Major update improving simplicity
- Simplified build, now exported as ESM modules only.
- Now based on Web-interoperable APIs (such as `fetch()` and `crypto.subtle`).
  - Usage on Web-interoperable runtimes no longer requires polyfills for Node.js
    functionality such as `node:crypto`.
  - `isWsOverHttp()` and `getWebSocketContextFromReq()` functions now work with
    `Request` objects rather than Node.js's `IncomingMessage` objects.
- Separated out Node.js support into its own export, `"@fanoutio/grip/node"`.
  - `isNodeReqWsOverHttp()` and `getWebSocketContextFromNodeReq()` functions work with
    Node.js's `IncomingMessage` objects.
- `GRIP_URL` now allows `key` and `verify-key` query parameters to be provided as:
  - JSON stringified representation of `JsonWebKey`
  - base64-encoded representations (prefixed with `base64:`) of `Uint8Array`, JSON-stringified `JsonWebKey`,
    or PEM file (SPKI or PKCS#8).
- `parseGripUri` now accepts a second parameter which can be used to merge parameters into a `IGripConfig`.
- `validateGripSig` is now available on `Publisher`, allowing you to easily check a
  `Grip-Sig` header against the publisher clients registered with a `Publisher`.
- `Publisher` can now be configured with a custom channel prefix that will be applied
  when publishing messages.
- `Publisher` can now be configured with an override `fetch()` function that will be
  called when publishing messages.
- Public Keys for Fastly Fanout are now exported as constants.

## [3.3.1] - 2023-09-14
- Updated dependency versions

## [3.3.0] - 2023-09-02

### Added
- Support for `verify_iss` and `verify_key` GRIP configurations and parsing them from GRIP_URLs.
- Support for Bearer tokens, using the new `Auth.Bearer` class.
  - Use a Bearer token by creating IGripConfig with `key`, but without a `control_iss`. This can also be parsed from
    `GRIP_URL` that have a `key` without an `iss`. 
- Updated with full support for Fastly Fanout.

## [3.2.0] - 2022-11-06
- Revert to npm instead of pnpm
- Removed unneeded log message

## [3.1.0] - 2022-06-06
- Now uses pnpm instead of npm
- Pluggable architecture for Publishers that need to use a different transport mechanism

## [3.0.0] - 2020-08-24
- Major update with great improvements in usability, with support for modern
  language features such as `class` and `async`/`await`.
- Collapsed `js-pubcontrol` into `js-grip`, simplifying use and deployment.
- Reorganized utility functions into categorized files.
- Rewritten in TypeScript and exporting types files to enable static type checking and
  IDE completion. 
- CommonJS and ESM builds are standard TypeScript builds, so that they can be imported in
  Node and in modern bundlers that offer features such as tree shaking.
- Source code formatted with Prettier. 

### Added
- `GripInstruct` class to handle generation of `Grip-*` headers

### Changed
- Using `jsonwebtoken` library instead of `jwt-simple`. This is a more modern implementation that
  does not depend on the `crypto` library from Node.   
- `buildWebSocketControlMessage()` renamed to `createWebSocketControlMessage()`.

### Removed
- Removed `createHold*` functions in favor of `GripInstruct` class 

## [2.0.0-beta.0] - 2020-01-13
### Added
- Added ESM build. Uses Rollup (https://rollupjs.org/) to build bundles for consumption as
  CommonJS, ESM, and the Browser.
- Added new simple NodeJS based demo, providing a server and a publisher, designed
  to be used with pushpin (https://pushpin.org).
- Added a shimmed `Buffer` object to browser build, as it is needed during JWT authorization.
- IDE metadata for IntelliJ IDEA.  

### Changed
- Repository now called `js-grip` to reflect that this is useful in all types of JavaScript,
  including the browser.
- Now distributed as a public scoped package `@fanouio/grip`.
- Source files and tests rewritten in modern style JavaScript
- Source files moved from `/lib` to `/src`
- Basic data structures now using ES6 classes.
- Start using "changelog" over "change log" since it's the common usage.
- Bump major version to 2 to indicate that this is a modernized new version.
- Improved README by being more straightforward with the basic use case.
- `GripPubControl` now directory inherits from `PubControl`. 
- `GripPubControl.publish` API has been changed, and the callback is now optional.
  If no callback is provided, a Promise is returned instead.

### Removed

## Older entries

v 0.1.0 04-03-2013  - Initial Release. Formats, Channel, Response, Publisher.  
v 0.1.1 04-16-2013  - Fixed serious bug in Response that was preventing proper JSON generation.  
v 0.1.2 04-17-2013  - Signature validation, HttpStream Close.  
v 0.1.3 04-18-2013  - Fixed signature validation exp calculation.  
v 0.1.4 04-18-2013  - Updated samples to match pubcontrol v0.2  
v 0.1.5 05-15-2013  - Documentation updates to reflect new company name.  
v 1.0.0 01-21-2015  - Changed design to match the other language libs.  
v 1.1.0 01-22-2015  - Added an applyConfig method to GripPubControl.  
v 1.2.0 01-31-2015  - Added timeout functionality to create_hold_response.  
v 1.2.1 02-02-2015  - Updated the dependency versions.  
v 1.2.2 03-03-2015  - Added createHold as an export.  
v 1.2.3 03-03-2015  - Added buffer decoding to decodeWebSocketEvents.  
v 1.2.4 03-08-2015  - Added buffer encoding to decodeWebSocketEvents.  
v 1.2.5 03-25-2015  - Split code into multiple files and added tests and docs.  
v 1.2.6 12-10-2017  - Implement workaround for parseGripUri.
v 1.2.7 12-13-2017  - Clean package dir.


[unreleased]: https://github.com/fanout/js-grip/compare/v4.0.2...HEAD
[4.0.2]: https://github.com/fanout/js-grip/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/fanout/js-grip/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/fanout/js-grip/compare/v3.3.1...v4.0.0
[3.3.1]: https://github.com/fanout/js-grip/compare/v3.3.0...v3.3.1
[3.3.0]: https://github.com/fanout/js-grip/compare/v3.2.0...v3.3.0
[3.2.0]: https://github.com/fanout/js-grip/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/fanout/js-grip/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/fanout/js-grip/compare/v2.0.0-beta.0...v3.0.0
[2.0.0-beta.0]: https://github.com/fanout/js-grip/releases/tag/v2.0.0-beta.0
