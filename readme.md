# Rsync Toolkit

The Rsync Toolkit is a command line tool that facilitates the process of syncing local directories to remote directories using the rsync utility. It provides a simple and intuitive interface for developers to manage syncing multiple directories into multiple sites easily.

## Prerequisites

Before using this tool, ensure the following software is installed on your system:

-   Node.js v16
-   rsync

## Usage

The tool has the following commands:

### `woa connect [alias] [hostname] [username] [identityFilePath]`

This command connects to the specified SSH host and adds a configuration entry in `~/.ssh/config` for future use.

#### Arguments

-   `alias` - Alias to be used when connecting to the specified host
-   `hostname` - Hostname to connect to
-   `username` - Username to use for authentication
-   `identityFilePath` (optional) - Path to the identity private key file to use for authentication

#### Example usage

`woa connect mysite myhost username /path/to/private/key`

This command will connect to `myhost` using the provided username and private key file, and add a configuration entry to `~/.ssh/config` with the alias `mysite`. This will allow you to later connect to the same server simply by running `ssh mysite`.

### `woa sync [host]`

Syncs local directories with remote directories using rsync.

`woa sync mysite`

### `woa watch [host]`

Listens for changes in local directories and syncs them with remote directories using rsync.

`woa watch mysite`

### `woa sites`

Lists all host aliases present in the `~/.ssh/config` file.

### `woa help`

Displays the help menu.

## Installation

To install this tool, follow the steps below:

1.  Clone the repository to your local machine
2.  Navigate to the cloned directory
3.  Run `npm install` to install dependencies
4.  Run `npm run setup` to configure the tool
5.  Modify the `~/.woa_projects.json` file with a list of projects you want to sync. Here's an example:
```json
[
  {
    "name": "Project 1",
    "value": "project1",
    "args": ["--exclude", ".git", "--exclude", ".cache", "--exclude", "node_modules/", "--exclude", "tests/"],
    "localDir": "/path/to/project1",
    "remoteDir": "/path/to/remote/project1"
  },
  {
    "name": "Project 2",
    "value": "project2",
    "args": ["--exclude", ".git", "--exclude", ".cache", "--exclude", "node_modules/", "--exclude", "tests/"],
    "localDir": "/path/to/project2",
    "remoteDir": "/path/to/remote/project2"
  }
]
```

**Note:** Make sure not to include any trailing commas at the end of each object or property.

6.  _(Optional)_ Run the `source` command as described to update the shell.

## Disclaimer

The Rsync Toolkit is a one-way syncing tool, meaning it only supports syncing from local directories to remote directories and not vice versa. We recommend taking appropriate precautions before using the tool to ensure that your data is not lost or corrupted during the syncing process.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1.  Create a new branch for your feature or bug fix
2.  Write your code for your changes
3.  Commit your changes and push them
4.  Submit a pull request
