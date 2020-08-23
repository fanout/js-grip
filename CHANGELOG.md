# js-grip Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
