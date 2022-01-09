export function addLine(text) {
    var terminal = document.getElementById("terminal");
    var outputNode = document.createElement("div");
    outputNode.classList.add("entry");
    outputNode.innerHTML = text;
    terminal.appendChild(outputNode);
}

export function blink() {
    var terminal = document.getElementById("terminal");
    var hiddenPrompt = document.getElementById("hidden-prompt");
    if (!terminal.lastElementChild.classList.contains("cursor") && hiddenPrompt.matches(":focus")) {
        terminal.lastElementChild.classList.add("cursor");
    } else {
        terminal.lastElementChild.classList.remove("cursor");
    }
}

export function onFocus(e) {
    var hiddenPrompt = document.getElementById("hidden-prompt");
    hiddenPrompt.focus();
    hiddenPrompt.selectionEnd = hiddenPrompt.selectionStart = hiddenPrompt.value.length;
}

export function onChange(state, e) {
    // Override the onChange event if loaded for a currently running command
    if (state.commandInjection && state.commands[state.commandInjection].onChange) {
        return state.commands[state.commandInjection].onChange(state, e);
    }

    var terminal = document.getElementById("terminal");
    var hiddenPrompt = document.getElementById("hidden-prompt");
    terminal.lastElementChild.innerHTML = state.prefix + hiddenPrompt.value;

    return true;
}

export async function onKeyDownAsync(state, e) {
    if (e.key === 'ArrowUp' && !e.repeat) {
        return onUp(state, e);
    } else if (e.key === 'ArrowDown' && !e.repeat) {
        return onDown(state, e);
    } else if (e.ctrlKey && !e.repeat && e.key === 'c') {
        return await onCancelAsync(state, e);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        return false;
    }
}

function onUp(state, e) {
    if (state.selectedCmd > 0) {
        state.selectedCmd--;
    }
    if (state.selectedCmd < state.priorCmds[state.currentMachineName].length) {
        var hiddenPrompt = document.getElementById("hidden-prompt");
        hiddenPrompt.value = state.priorCmds[state.currentMachineName][selectedCmd];
        window.setTimeout(onFocus, 0);
        onChange(state);
    }
    return true;
}

function onDown(state, e) {
    if (state.selectedCmd < state.priorCmds[state.currentMachineName].length -1) {
        state.selectedCmd++;
    }
    if (state.selectedCmd < state.priorCmds[state.currentMachineName].length) {
        var hiddenPrompt = document.getElementById("hidden-prompt");
        hiddenPrompt.value = state.priorCmds[state.currentMachineName][selectedCmd];
        window.setTimeout(onFocus, 0);
        onChange(state);
    }
    return true;
}

async function onCancelAsync(state, e) {
    var hiddenPrompt = document.getElementById("hidden-prompt");
    hiddenPrompt.value += "^C";
    onChange(state);
    addLine("");
    onChange(state);
}

export function MOTD(state) {
    state.config.MOTDs[state.currentMachineName].forEach(addLine);
    addLine("");
}

export function loadPrefix(state) {
    state.prefix = `${state.currentLogin}@${state.currentMachineName}:${state.currentDir}$ `;
    return state;
}

export function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

