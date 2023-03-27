# io-std

## Prerequisites

In order to run the `io-sign` back-end/front-end locally you need the following tool installed on your machine.

- `Node.js 18`
- `yarn 3`

The preferred way to set up the local environment is using [nodenv](https://github.com/nodenv/nodenv) to manage `Node.js` installation and `corepack` (included with `Node.js`) to manage the installation of `yarn`.

## Release management

This project uses [changesets](https://github.com/changesets/changesets) to automate updating package versions, and changelogs.

Each Pull Request that includes changes that require a version bump should include a `changeset` file that describe that changes.

To create a new `changeset` file run the following command from the project root:

```bash
yarn changeset
```

## Useful commands

This project uses `yarn@3` with workspaces and [turborepo](https://turbo.build/repo) to manage projects and dependencies. Here is a list of useful commands to work in this repo.

### Work with workspaces

```bash
# to execute COMMAND on WORKSPACE_NAME
yarn workspace WORKSPACE_NAME run command
# to execute COMMAD on all workspaces
yarn workspace foreach run command

# run unit tests on @pagopa/handler-kit
yarn workspace @pagopa/handler-kit run test

# run the typecheck script on all workspaces
yarn workspaces foreach run typecheck
```

### Add dependencies

```bash
# add a dependency to the workspace root
yarn add turbo

# add vitest dev dependency on @pagopa/handler-kit
yarn workspace @pagopa/handler-kit add -D vitest

# add io-ts as dependency on each workspace
yarn workspace foreach add io-ts
```

### Root scripts

```bash
# builds all workspaces and their dependencies
yarn build

# build @pagopa/handler-kit and its dependencies
yarn build --filter @pagopa/handler-kit

# run the code-review script (the same as the CI)
yarn code-review
```
