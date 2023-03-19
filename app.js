/**
 * Libraries.
 */
const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const { exec, spawn } = require("child_process");
const chokidar = require("chokidar");
const cliSpinners = require("cli-spinners");
const colors = require("colors");
const figlet = require("figlet");
const ssh2 = require('ssh2');
const SSH = ssh2.Client;

/**
 * Configuration.
 */
const SCRIPT_NAME = "woa";
const PROJECTS_CONFIG_FILE_NAME = ".woa_projects.json";
const SHELL = process.env.SHELL.split("/").slice(-1)[0];
const PROJECTS_WOA_DEV_FILE = path.join(process.env.HOME, PROJECTS_CONFIG_FILE_NAME);
colors.enable();

const checkNode = () => {
  const nvmrc = fs.readFileSync(".nvmrc", "utf8").trim();
  const majorVersion = Number.parseInt(nvmrc.split(".")[0]);

  // Get the system's current major version
  const currentMajorVersion = Number.parseInt(
    process.version.split(".")[0].slice(1)
  );

  // Check if the major versions match
  if (majorVersion !== currentMajorVersion) {
    console.log(
      `Error: The system is running Node.js v${currentMajorVersion}, but this app requires v${majorVersion}`
        .red
    );
    return false;
  } else {
    return true;
  }
};

/**
 * Setup.
 */
const isSetup = process.argv[2] === "setup";
if (isSetup) {
  const SHELL_RC_FILES = {
    bash: ".bashrc",
    zsh: ".zshrc",
    fish: ".config/fish/config.fish",
  };

  if (!(SHELL in SHELL_RC_FILES)) {
    console.error(`Shell "${SHELL}" not supported`.red);
    process.exit(1);
  }

  figlet("Rsync Toolkit Setup", function (err, data) {
    if (err) {
      return;
    }

    // Print header.
    console.log(data.grey);
    console.log("\n===============================".yellow);
    console.log("\nInstalling Rsync Toolkit...".yellow);

    // Write RC File.
    const rcFile = SHELL_RC_FILES[SHELL];
    const rcFilePath = path.join(process.env.HOME, rcFile);
    const aliasCommand = `alias woa='node ${path.join(__dirname, "app.js")}'\n`;

    console.log("\n - Adding shell alias".yellow);
    fs.readFile(rcFilePath, "utf-8", (err, data) => {
      // Add shortcut to source file.
      if (err) {
        console.error(`Error reading file: ${err.message}`.red);
      } else if (data.includes(aliasCommand)) {
        console.log(`Alias command already exists in ${rcFile}.`.grey);
      } else {
        fs.appendFile(
          rcFilePath,
          "\n# rsync-dev-toolkit\n" + aliasCommand,
          (err) => {
            if (err) {
              console.error(`Error writing file: ${err.message}`.red);
              return;
            }

            console.log(`Alias command added to ${rcFile}.`.grey);

            if (SHELL === "fish") {
              console.log(
                "Please reload the fish shell to make the alias available".grey
              );
            } else {
              console.log(
                `Please run `.grey +
                  `source ${rcFilePath}`.yellow +
                  ` to make the alias available`.grey
              );
            }
          }
        );
      }

      // Check Rsync.
      console.log("\n - Checking rsync".yellow);
      exec("rsync --version", (error) => {
        if (error) {
          console.log("rsync is not installed on this system.".grey);
        } else {
          console.log("rsync is installed on this system.".grey);
        }

        // Check NodeJS.
        console.log("\n - Checking NodeJS".yellow);
        if (checkNode()) {
          console.log(
            "The system is running Node.js v16, which is compatible with this app."
              .grey
          );
        }

        // Create projects file.
        const projectsFilePath = path.join(
          process.env.HOME,
          PROJECTS_CONFIG_FILE_NAME
        );
        console.log(
          `\n - Creating the projects configuration file at ${projectsFilePath}`
            .yellow
        );
        if (fs.existsSync(projectsFilePath)) {
          console.log(`Configuration file already exists.`.grey);
        } else {
          const projects = [];

          fs.writeFile(projectsFilePath, JSON.stringify(projects), (err) => {
            if (err) {
              console.error(`Failed to create projects file: ${err}`.red);
            } else {
              console.log("Projects file created successfully.".grey);
            }
          });
        }

        console.log("\n===============================\n".yellow);
      });
    });
  });
}

/**
 * Fetch tasks/projects.
 */
const tasks = [];
if (fs.existsSync(PROJECTS_WOA_DEV_FILE)) {
  try {
    const projects = JSON.parse(fs.readFileSync(PROJECTS_WOA_DEV_FILE, "utf8"));
    if (!projects || !projects.length) {
      console.error(
        `Projects are empty in ${PROJECTS_WOA_DEV_FILE} file. Please create some to proceed.`
          .red
      );
      console.log(`Got: ${projects}`.cyan);
      process.exit(1);
    }

    projects.forEach((project) => {
      tasks.push(project);
    });
  } catch (error) {
    console.error(
      `There is an error in your ${PROJECTS_WOA_DEV_FILE} file. Please ensure that no trailing commas exist in the configuration.`
        .red
    );
    console.error(error);
    process.exit(1);
  }
} else {
  console.error(
    `Missing ${PROJECTS_WOA_DEV_FILE} file. Please create one to proceed.`.red
  );
  process.exit(1);
}

/**
 * Check environment/Create ssh config file if it doesn't exist.
 */
const configFilePath = `${process.env.HOME}/.ssh/config`;
if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, "");
}

/**
 * Run Commands.
 */
const connectTask =
  process.argv[2] === "connect" &&
  process.argv[3] &&
  /^[a-z0-9]+$/.test(process.argv[3]) &&
  process.argv[4] &&
  /^[a-z0-9\.]+$/.test(process.argv[4]) &&
  process.argv[5] &&
  /^[a-z0-9\.]+$/.test(process.argv[5]) &&
  (process.argv[6] === undefined || /^[a-zA-Z0-9\/\\:\._-]+$/.test(process.argv[6]));
const rsyncTask =
  process.argv[2] === "rsync" &&
  process.argv[3] &&
  /^[a-z0-9]+$/.test(process.argv[3]);
const watchTask =
  process.argv[2] === "watch" &&
  process.argv[3] &&
  /^[a-z0-9]+$/.test(process.argv[3]);
const helpTask = process.argv[2] === "help";
const sitesTask = process.argv[2] === "sites";

if (helpTask || (!sitesTask && !isSetup && !connectTask && !rsyncTask && !watchTask)) {
  figlet("Rsync Toolkit", function (err, data) {
    if (err) {
      return;
    }
    console.log(data.grey);
    console.log("\n===============================".grey);
    console.log(
      `
Usage: ${SCRIPT_NAME} <command> [host]

Commands:
  ${SCRIPT_NAME} connect [alias] [hostname] [username] [identityfilepath]

    Connect to the specified SSH host and adds a configuration entry in ~/.ssh/config for future use.

    Arguments:
      alias            The host alias to use from your ssh config file.
      hostname         The remote hostname to connect to.
      username         The remote username to connect as.
      identityfilepath (optional) The file path to the private key used for authentication.

    Examples:
      ${SCRIPT_NAME} connect myserver myserver.com john ~/.ssh/mykey.pem

  ${SCRIPT_NAME} rsync [host]     Sync files with a remote host via rsync
  ${SCRIPT_NAME} watch [host]     Watch files in local directories and sync changes with a remote host via rsync
  ${SCRIPT_NAME} sites            Lists all host aliases present in the ~/.ssh/config file
  ${SCRIPT_NAME} help             Display this usage information
		`.grey
    );
  });
}

if (sitesTask) {

	if (!fs.existsSync(configFilePath)) {
		console.error(`Could not find ssh config file at path: ${configFilePath}`.red);
		process.exit(1);
	}

	const sshConfig = fs.readFileSync(configFilePath, 'utf-8');
	const aliases = sshConfig.match(/Host\s+(\S+)/g);

	if (!aliases) {
		console.log(`No host aliases found in ssh config file: ${configFilePath}`.grey);
	} else {
		console.log(`List of host aliases in ssh config file ${configFilePath}:`.white);
		aliases.forEach(alias => {
			const match = alias.match(/Host\s+(\S+)/);
			if (match && match[1]) {
			  console.log(`- ${match[1]}`.blue);
			}
		});
	}

} else if (connectTask) {

	const hostname = process.argv[3];
	const host = process.argv[4];
	const username = process.argv[5];
	const identityfile = process.argv[6];
	if (!checkNode()) {
		process.exit(1);
	}

	// Test if we can connect to the hostname using ssh
	const conn = new SSH();
	let connectConfig = {
		host: host,
		port: 22,
		username: username
	};
	if ( identityfile ) {
		connectConfig.privateKey = fs.readFileSync(identityfile);
	}
	console.log(`Connecting to ${hostname}...`.blue)
	conn.on('ready', () => {
		console.log(`Connected to ${hostname} using ssh`.green);

		let config = `\nHost ${hostname}\n  HostName ${host}\n  User ${username}`;
		if ( identityfile ) {
			config = `${config}\n  IdentityFile ${identityfile}`;
		}

		if (!fs.readFileSync(configFilePath).includes(`Host ${hostname}`)) {
			fs.appendFileSync(configFilePath, config);
			console.log(`Added config for ${hostname} to ~/.ssh/config.\nYou can now run `.green + `ssh ${hostname}`.blue +` to connect.`.green);
		} else {
			console.log(`Config for ${hostname} already exists in ~/.ssh/config`.blue);
		}
		conn.end();

	})
	conn.on('error', (err) => {
		console.error(`Connection error for ${hostname}: ${err}`.red);
	})
	conn.connect(connectConfig);

} else if (rsyncTask) {
  const hostname = process.argv[3];
  if (!checkNode()) {
    process.exit(1);
  }

  if (!fs.readFileSync(configFilePath).includes(`Host ${hostname}`)) {
    console.log(
      `Hostname `.red +
        `${hostname}`.cyan +
        ` doesn't seem to be properly installed in the system. \nRun `.red +
        `"${SCRIPT_NAME} connect ${hostname}"`.cyan +
        ` to get started.`.red
    );
    process.exit(1);
  }

  inquirer
    .prompt([
      {
        type: "checkbox",
        message: "Select the tasks you want to run:",
        name: "chosen_tasks",
        choices: tasks,
      },
    ])
    .then((answers) => {
      const { chosen_tasks } = answers;
      const commands = [];

      chosen_tasks.forEach((task) => {
        const result = tasks.find((obj) => obj.value === task);
        if (result.localDir && result.remoteDir) {
          // console.log(`\nRsync: `.blue + `${result.name}`.white);
          // console.log(`Syncing `.blue + `${result.localDir}`.bold.yellow + ` to `.blue +`${hostname}:${result.remoteDir}`.bold.yellow);

          const rsyncCommand = `rsync -avz ${result.args.join(" ")} ${
            result.localDir
          } ${hostname}:${result.remoteDir}`;
          commands.push(rsyncCommand);
        }
      });

      if (commands.length) {
        // Run the commands in parallel and group the output
        const renderGroupedOutput = (results) => {
          results.map(({ command, data }) => {
            console.group("=== Rsync Group ===".white);
            console.log(`Command:\n`.yellow + command.grey);
            console.log(`Output:\n`.yellow + data.grey);
            console.groupEnd();
            console.log("===================".white);
          });
        };

        const runCommands = async (commands) => {
          const results = await Promise.all(
            commands.map((command) => {
              const [cmd, ...args] = command.split(" ");
              return new Promise((resolve) => {
                const child = spawn(cmd, args);
                let data = "";
                child.stdout.on("data", (chunk) => {
                  data += chunk.toString();
                });
                child.stdout.on("end", () => {
                  resolve({ command, data });
                });
              });
            })
          );

          renderGroupedOutput(results);
        };

        runCommands(commands);
      }
    });
} else if (watchTask) {
  const hostname = process.argv[3];
  if (!checkNode()) {
    process.exit(1);
  }
  if (!fs.readFileSync(configFilePath).includes(`Host ${hostname}`)) {
    console.log(
      `Hostname `.red +
        `${hostname}`.cyan +
        ` doesn't seem to be properly installed in the system. \nRun `.red +
        `"${SCRIPT_NAME} connect ${hostname}"`.cyan +
        ` to get started.`.red
    );
    process.exit(1);
  }

  inquirer
    .prompt([
      {
        type: "checkbox",
        message: "Select the tasks you want to run:",
        name: "chosen_tasks",
        choices: tasks,
      },
    ])
    .then((answers) => {
      // Gather watched directories.
      const directoriesToWatch = [];
      const { chosen_tasks } = answers;
      chosen_tasks.forEach((task) => {
        const result = tasks.find((obj) => obj.value === task);
        if (!result || !result.localDir) {
          console.log(`Missing SSH arguments for ${task}`.red);
          return;
        }

        directoriesToWatch.push(result.localDir);
      });

      // Initiate the watcher.
      const watcher = chokidar.watch(directoriesToWatch, {
        ignoreInitial: true,
        usePolling: false,
        followSymlinks: true,
        interval: 100,
        binaryInterval: 300,
        alwaysStat: false,
        depth: 99,
      });

      // When watcher's ready, show the loading line.
      let blockLoader = false;
      const onReady = () => {
        const loader = cliSpinners.dots3;
        const frames = loader.frames;
        let i = 0;

        setInterval(() => {
          if (blockLoader) return;
          process.stdout.write(
            `\r${frames[i]} Listening for changes to upload to ${hostname}...`
              .yellow
          );
          i = (i + 1) % frames.length;
        }, loader.interval);
      };

      watcher.on("ready", onReady);

      // Handle file changes.
      const onChange = (filePath) => {
        blockLoader = true;

        const result = tasks.find((obj) => filePath.includes(obj.localDir));

        console.group(`\n[${result.name}]`.blue);
        // console.log(`\nProject changed: `.blue + `${result.name}`.white);
        console.log(
          `Syncing `.blue +
            `${result.localDir}`.bold.yellow +
            ` to `.blue +
            `${hostname}:${result.remoteDir}`.bold.yellow
        );

        const rsyncCommand = `rsync -avz ${result.args.join(" ")} ${
          result.localDir
        } ${hostname}:${result.remoteDir}`;

        const childProcess = spawn(rsyncCommand, [], { shell: true });

        childProcess.stdout.on("data", (data) => {
          console.log(`stdout: ${data}`.grey);
        });

        childProcess.stderr.on("data", (data) => {
          console.error(`stderr: ${data}`.red);
        });

        childProcess.on("error", (error) => {
          console.error(`Error running command: ${error}`.red);
          blockLoader = false;
        });

        childProcess.on("exit", () => {
          blockLoader = false;
        });

        childProcess.on("close", () => {
          console.error(`Done`.green);
          console.groupEnd();
          blockLoader = false;
        });
      };

      // Debounce file changes for performance.
      let debounceInterval;
      const onChangeDebounced = (filePath) => {
        clearTimeout(debounceInterval);
        debounceInterval = setTimeout(() => {
          onChange(filePath);
        }, 2000);
      };

      watcher.on("change", onChangeDebounced);
    });
}

// Say goodbye.
process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    console.log("Bye!".yellow);
    process.exit();
  }
});
