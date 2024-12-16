# CHANGELOG.md

## Purpose

This changelog serves as a centralized guide for resolving breaking changes introduced by new updates. Developers must follow the outlined steps before merging their feature branches into the `dev` branch.

## Documentation

Ensure the following files are up-to-date:

- [Updated .env file](https://docs.google.com/spreadsheets/d/1F0s0Q8kT_GC2t23W6UQ3cUlk4Dg2GF2gwSf4UyYvNeM/edit#gid=1477733540)
- [Updated config file](https://docs.google.com/spreadsheets/d/1F0s0Q8kT_GC2t23W6UQ3cUlk4Dg2GF2gwSf4UyYvNeM/edit#gid=1596800285)

---

## Breaking Changes

### December 13, 2024 - Logging Standards

**Summary**: A new logging standard has been implemented to improve log consistency and debugging efficiency.

**Impact**:

- Existing logging functions may be incompatible with the new standard.
- Logging outputs must now follow a specific format.

**Steps to Resolve**:

1. Review the [Logging Guidelines Document](https://docs.google.com/document/d/1d3-CR-62lCgpu_WM859JNiHVFJAOUmZp6FBZHr7ePmo/edit?tab=t.0#heading=h.qb1dgoz6jo20).
2. Refactor existing logging functions to adhere to the guidelines.

---

### December 10, 2024 - Encryption and Decryption

**Summary**: Encryption and decryption workflows have been implemented, affecting all modules handling sensitive data.

**Impact**:

- If keys are not put inside the api directory as per the document below, the code will crash.

**Steps to Resolve**:

1. Review the [Encryption and Decryption Workflow Documentation](https://docs.google.com/document/d/1H2Ihd-EE2cXLGT7UUi_ZfBhMZLT0eI8gTnUXIPAn-M4/edit?tab=t.0#heading=h.4qvdn6nfmvuh).
2. Create specific named folder and put public/private keys inside it.

---

## Important

Developers must resolve all breaking changes and validate their changes locally before creating a pull request for the `dev` branch.
