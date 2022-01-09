/**
 * Define the chunk method in the prototype of an array
 * that returns an array with arrays of the given size.
 *
 * @param chunkSize {Integer} Size of every group
 */
Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize){
        var temporal = [];
        
        for (var i = 0; i < this.length; i+= chunkSize){
            temporal.push(this.slice(i,i+chunkSize));
        }
        
        return temporal;
    }
});

/**
 * Filter an array down to only distinct values
 */
Object.defineProperty(Array.prototype, 'distinct', {
    value: function(chunkSize){
        return this.filter((v, i, a) => a.indexOf(v) === i);
    }
});

import FileLoader from "./fileLoader.js";
import * as Terminal from "./terminal.js";

export async function startupAsync() {
    var state = {};
    var configLocal = await FileLoader.fetchJson("config.json");

    state.config = {
        github: configLocal.github,
        logins: configLocal.logins,
        MOTDs: configLocal.MOTDs,
        blinkRate: configLocal.blinkRate
    }

    state.priorCmds = configLocal.priorCmds || {};
    state.currentLogin = "";
    state.currentMachineName = configLocal.init.machineName;
    state.currentDir = configLocal.init.directory;
    state.commandInjection = "";

    state.repoDirs = await FileLoader.fetchDirectories(
        state.config.github.username, 
        state.config.github.repo, 
        state.config.github.branch
    );

    state = await parseDirectoriesAsync(state);
    state.selectedCmd = state.priorCmds[state.currentMachineName].length;
    state = startupCommands(state);
    bindEvents(state);

    Terminal.MOTD(state);
    Terminal.addLine("");

    await state.commands["su"].invokeAsync(state, [configLocal.init.login])

    state = Terminal.loadPrefix(state);
    Terminal.onChange(state);
}

async function parseDirectoriesAsync(state) {
    state.machines = {};

    var cmdPaths = ["su.js", "nmap.js"];

    state.repoDirs.forEach(dir => {
        if (dir.path.startsWith("NETWORK/")) {
            var networkPath = dir.path.slice(8);
            var machineName = networkPath.split("/")[0];
            var internalPath = networkPath.slice(machineName.length)
            if (!internalPath.length)
                return;

            if (!(machineName in state.machines)) {
                state.machines[machineName] = {
                    "/": "tree"
                };
            }
            if (!(machineName in state.priorCmds)) {
                state.priorCmds[machineName] = [];
            }

            state.machines[machineName][internalPath] = dir.type;
        }
        if (dir.path.startsWith("commands/")) {
            cmdPaths.push(dir.path.slice(9));
        }
    });

    state.commands = {};

    for (var n = 0; n < cmdPaths.length; n++) {
        var cmdPath = cmdPaths[n];
        const cmd = await import("../../commands/"+cmdPath);
        state.commands[cmd.default.name] = cmd.default;
    }

    return state;
}

function startupCommands(state) {
    Object.keys(state.commands).forEach(cmd => {
        state = state.commands[cmd].startup(state) || state;
    });
    return state;
}

function bindEvents(state) {
    var terminal = document.getElementById("terminal");
    var hiddenPrompt = document.getElementById("hidden-prompt");
    var hiddenPromptForm = document.getElementById("hidden-prompt-form");

    window.setInterval(Terminal.blink, state.config.blinkRate);

    hiddenPrompt.addEventListener("blur", Terminal.onFocus);
    hiddenPrompt.addEventListener("focus", Terminal.onFocus);
    window.addEventListener("focus", Terminal.onFocus);
    terminal.addEventListener("focus", Terminal.onFocus);
    Terminal.onFocus();

    hiddenPrompt.addEventListener("input", (e) => Terminal.onChange(state, e));

    hiddenPrompt.addEventListener("keydown", (e) => Terminal.onKeyDownAsync(state, e));

    hiddenPromptForm.addEventListener("submit", (e) => onInputAsync(state, e));
}

async function onInputAsync(state, e) {
    var terminal = document.getElementById("terminal");
    var hiddenPrompt = document.getElementById("hidden-prompt");

    if (e) {
        e.preventDefault();
    }

    var oldInput = terminal.lastElementChild;

    await runCmdAsync(state);
    Terminal.addLine("");

    oldInput.classList.remove("cursor");

    hiddenPrompt.value = "";

    Terminal.onChange(state);

    return false;
}

async function runCmdAsync(state) {
    var hiddenPrompt = document.getElementById("hidden-prompt");
    var cmd = hiddenPrompt.value.trim();

    var args = cmd.split(' ');

    if (state.commandInjection !== "") {
        await state.commands[state.commandInjection].invokeAsync(state, args);
        return;
    }

    if (args.length < 1 || args[0].length < 1)
        return;
    
    if (cmd.endsWith("^C")) {
        return;
    }

    state.priorCmds[state.currentMachineName].push(cmd);
    state.selectedCmd = state.priorCmds[state.currentMachineName].length;

    if (args[0] in state.commands) {
        state = (await state.commands[args[0]].invokeAsync(state, args.slice(1))) || state;
        return;
    }

    Terminal.addLine(`Unrecognized command: "${args[0]}"`);
}

async function execAsync(args) {
    if (!args.length) {
        return help("exec");
    }
    if (args.length > 1) {
        return unrecognized(args[1]);
    }

    var targetPath = window.posix.resolve(currentDir, args[0]);

    if (dirs.some(dir => dir.path === targetPath && dir.type === 'blob'))
    {
        if (!targetPath.endsWith(".exe")) {
            return `File "${targetPath}" is not executable.`;
        }
        return await executePathAsync(targetPath);
    } else {
        return unknownFile(targetPath);
    }
}

async function executePathAsync(path) {
    var username = config.github.username;
    var repo = config.github.repo;
    var branch = config.github.branch;

    var url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/ROOT${path}`;
    var response = await fetch(url)
    program = await response.json();
    executeProgram();
    return "";
}

function executeProgram() {
    var entry = program[programState];
    addLine(entry.prompt);
    programMode = entry.type;
    if (programMode === 'menu') {
        entry.options.forEach((option, n) => {
            addLine(`${n}. ${option.prompt}`);
        });
    }
}

function programInput() {
    if (programMode === 'menu' ) {
        return menuInput();
    } else if (programMode === 'password') {
        return passwordInput();
    }
}