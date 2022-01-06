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

var terminal;
var hiddenPrompt;
var hiddenPromptForm;

var config = {};
var dirsRaw = {};
var dirs = [];
var currentDir = "";

var user = "";
var machineName = "";

var priorCmds = [];
var selectedCmd = 1;

var program = null;
var programMode = "menu";
var programState = "init";

(function() {
    terminal = document.getElementById("terminal");
    hiddenPrompt = document.getElementById("hidden-prompt");
    hiddenPromptForm = document.getElementById("hidden-prompt-form");

    fetch("config.json")
        .then(response => response.json())
        .then(json => {
            config = json;
            priorCmds = config.priorCmds;
            selectedCmd = priorCmds.length;
            loadDirs();
        });
    
})();

function loadDirs() {
    var username = config.github.username;
    var repo = config.github.repo;
    var branch = config.github.branch;

    var url = `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`

    fetch(url)
        .then(response => response.json())
        .then(json => {
            dirsRaw = json;
            currentDir = config.startDirectory;
            user = config.login;
            machineName = config.machineName;
            run();
        });
}

function run() {
    dirs.push({
        "path":"/",
        "type":"tree",
        "depth":0
    });
    dirsRaw.tree.forEach(dir => {
        if (dir.path.startsWith("ROOT/")) {
            var newDir = {
                "path": dir.path.slice(4),
                "type": dir.type,
                "depth": dir.path.slice(4).split("/").length -1
            };
            dirs.push(newDir);
        }
    });

    window.setInterval(blink, config.blinkRate);

    hiddenPrompt.addEventListener("blur", onFocus);
    hiddenPrompt.addEventListener("focus", onFocus);
    window.addEventListener("focus", onFocus);
    terminal.addEventListener("focus", onFocus);
    onFocus();

    hiddenPrompt.addEventListener("input", onChange);
    onChange();

    hiddenPrompt.addEventListener("keydown", onKeyDownAsync);

    hiddenPromptForm.addEventListener("submit", onInputAsync);
}

function onChange() {
    var prefix = "$";
    if (!program) {
        prefix = `${user}@${machineName}:${currentDir}$ `;
    }
    terminal.lastElementChild.innerHTML = prefix + hiddenPrompt.value;
}

async function onInputAsync(e) {
    if (e) {
        e.preventDefault();
    }

    var oldInput = terminal.lastElementChild;

    if (program) {
        programInput();
        return false;
    }

    var outputTextRaw = await runCmdAsync();
    var outputText = outputTextRaw.trim();
    addLine(outputText);

    var newInput = document.createElement("div");
    newInput.classList.add("entry");

    terminal.appendChild(newInput);

    oldInput.classList.remove("cursor");

    hiddenPrompt.value = "";

    onChange();

    return false;
}

function addLine(text) {
    if (text.length) {
        var outputNode = document.createElement("div");
        outputNode.classList.add("entry");
        outputNode.innerHTML = text;
        terminal.appendChild(outputNode);
    }
}

async function runCmdAsync() {
    var cmd = hiddenPrompt.value.trim();

    var args = cmd.split(' ');
    if (args.length < 1 || args[0].length < 1 || args[0].endsWith("^C"))
        return "";
    
    priorCmds.push(cmd);
    selectedCmd = priorCmds.length;

    if (args[0] === 'ls')
        return ls(args.slice(1));
    
    if (args[0] === 'cd')
        return cd(args.slice(1));

    if (args[0] === 'exec')
        return await execAsync(args.slice(1));

    if (args[0] === 'help')
        return help(args.slice(1));

    return unrecognized(args[0]);
}

function ls(args) {

    if (args.length > 1) {
        return unrecognized(args[1]);
    }

    var targetPath = currentDir;

    if (args.length) {
        targetPath = window.posix.resolve(currentDir, args[0]);
    }

    if (!targetPath.endsWith("/"))
        targetPath += "/";

    var results = [`<span class="tree">.</span>`];
    var depth = targetPath.split("/").filter(s => s.length).length;
    var matchingDirs = dirs.filter(dir => dir.path.startsWith(currentDir));

    if (!matchingDirs.length) {
        return unknownPath(targetPath);
    }

    if (matchingDirs.some(dir => dir.depth < depth)) {
        results.push(`<span class="tree">..</span>`);
    }

    matchingDirs.forEach(dir => {
        if (dir.depth <= depth)
            return;

        if (dir.depth > depth+1 && dir.type == 'blob')
            return;

        var subDir = dir.path.replace(targetPath, '').split("/")[0];
        results.push(`<span class="${dir.type}">${subDir}</span>`);
    });

    var layers = results.distinct().chunk(4).map(row => row.join(""));

    return "<div class='ls'>" + layers.join("</div><div class='ls'>") + "</div>";
}

function cd(args) {
    if (!args.length) {
        return help("cd");
    }
    if (args.length > 1) {
        return unrecognized(args[1]);
    }

    var targetPath = window.posix.resolve(currentDir, args[0]);

    if (dirs.some(dir => dir.path === targetPath && dir.type === 'tree'))
    {
        currentDir = targetPath;
    } else {
        return unknownPath(targetPath);
    }
    return "";
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

}

function help(args) {
    return "";
}

function unrecognized(cmd) {
    return `Unrecognized command "${cmd}"`;
}

function unknownPath(path) {
    return `Unrecognized path "${path}"`;
}

function unknownFile(path) {
    return `Unrecognized file "${path}"`;
}

function onFocus() {
    hiddenPrompt.focus();
    hiddenPrompt.selectionEnd = hiddenPrompt.selectionStart = hiddenPrompt.value.length;
}

function blink() {
    if (!terminal.lastElementChild.classList.contains("cursor") && hiddenPrompt.matches(":focus")) {
        terminal.lastElementChild.classList.add("cursor");
    } else {
        terminal.lastElementChild.classList.remove("cursor");
    }
}

async function onKeyDownAsync(e) {
    if (e.key === 'ArrowUp' && !e.repeat) {
        return onUp(e);
    } else if (e.key === 'ArrowDown' && !e.repeat) {
        return onDown(e);
    } else if (e.ctrlKey && !e.repeat && e.key === 'c') {
        return await onCancelAsync(e);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        return false;
    }
}

function onUp(e) {
    if (selectedCmd > 0) {
        selectedCmd--;
    }
    if (selectedCmd < priorCmds.length) {
        hiddenPrompt.value = priorCmds[selectedCmd];
        window.setTimeout(onFocus, 0);
        onChange();
    }
    return true;
}

function onDown(e) {
    if (selectedCmd < priorCmds.length -1) {
        selectedCmd++;
    }
    if (selectedCmd < priorCmds.length) {
        hiddenPrompt.value = priorCmds[selectedCmd];
        window.setTimeout(onFocus, 0);
        onChange();
    }
    return true;
}

async function onCancelAsync() {
    hiddenPrompt.value += "^C";
    onChange();
    await onInputAsync();
}