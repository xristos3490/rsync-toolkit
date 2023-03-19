# Rsync Development Toolkit

A command line tool that connects to a remote server and syncs local directories with remote directories using rsync.

## Prerequisites

Make sure the following software is installed on your system before using this tool:

-   Node.js v16 or higher
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

`woa connect myserver example.com myusername ~/.ssh/id_rsa`

This command will connect to `example.com` using the provided username and private key file, and add a configuration entry to `~/.ssh/config` with the alias `myserver`. This will allow you to later connect to the same server simply by running `ssh myserver`.

### `woa rsync [host]`

Syncs local directories with remote directories using rsync.

`woa rsync myserver`

### `woa watch [host]`

Listens for changes in local directories and syncs them with remote directories using rsync.

`woa watch myserver`

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
*Hint:* Make sure not to include any trailing commas at the end of each object or property.

6. _(Optional)_ Run the `source` command as described to update the shell

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1.  Create a new branch for your feature or bug fix
2.  Write your code for your changes
3.  Commit your changes and push them
4.  Submit a pull request to the `main` branch of the original repository

Please ensure your code adheres to the existing code style and passes the linter checks.

Thank you for contributing!
