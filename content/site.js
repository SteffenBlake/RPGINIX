var dir = "";
var user = "";
var machineName = "";

function loadDirs(config) {
    var username = config.github.username;
    var repo = config.github.repo;
    var branch = config.github.branch;

    var url = $`https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`

    fetch(url)
        .then(response => response.json())
        .then(json => run(config, json));
}

function run(config, dirsRaw) {
    dir = config.startDirectory;
    user = config.login;
    machineName = config.machineName;

    var dirs = [];

    dirsRaw.tree.forEach(dir => {
        if (dir.path.startsWith("ROOT/")) {
            dirs.add(dir.path.slice(5));
        }
    });

    var terminal = document.getElementById("terminal");
    var hiddenPrompt = document.getElementById("hidden-prompt");
    var hiddenPromptForm = document.getElementById("hidden-prompt-form");

    window.setInterval(() => blink(terminal, hiddenPrompt), config.blinkRate);

    window.onfocus = () => onFocus(hiddenPrompt);
    terminal.onfocus = () => onFocus(hiddenPrompt);
    hiddenPrompt.onblur = () => onFocus(hiddenPrompt);
    onFocus(hiddenPrompt);

    hiddenPrompt.oninput = () => onChange(config, terminal, hiddenPrompt);
    onChange(config, terminal, hiddenPrompt);

    hiddenPromptForm.onsubmit = (e) => onInput(e, config, terminal, hiddenPrompt);
}

function onChange(config, terminal, hiddenPrompt) {
    var prefix = `${user}@${machineName}:${dir}$ `;
    terminal.lastElementChild.innerHTML = prefix + hiddenPrompt.value;
}

function onInput(e, config, terminal, hiddenPrompt) {
    e.preventDefault();

    var oldInput = terminal.lastElementChild;

    var outputNode = document.createElement("div");
    outputNode.classList.add("entry");
    outputNode.innerHTML = runCmd(hiddenPrompt.value);

    var newInput = document.createElement("div");
    newInput.classList.add("entry");

    terminal.appendChild(outputNode);
    terminal.appendChild(newInput);

    oldInput.classList.remove("cursor");
    outputNode.classList.remove("cursor");

    hiddenPrompt.value = "";

    onChange(config, terminal, hiddenPrompt);

    return false;
}

function runCmd(cmd) {
    var args = cmd.split(' ');
    if (args.length < 1)
        return "";
    
    if (args[0] === 'ls')
        return ls(args.slice(1));
    
    if (args[0] === 'cd')
    return cd(args.slice(1));

    if (args[0] === 'help')
    return help(args.slice(1));

    return unrecognized(args[0]);
}

function ls(args) {

}

function cd(args) {
    
}

function help(args) {
    
}

function unrecognized(cmd) {
    return `Unrecognized command "${cmd}"`;
}

function onFocus(hiddenPrompt) {
    hiddenPrompt.focus();
}

function blink(terminal, hiddenPrompt) {
    if (!terminal.lastElementChild.classList.contains("cursor") && hiddenPrompt.matches(":focus")) {
        terminal.lastElementChild.classList.add("cursor");
    } else {
        terminal.lastElementChild.classList.remove("cursor");
    }
}


(function() {
    fetch("config.json")
        .then(response => response.json())
        .then(json => run(json));
    
})();