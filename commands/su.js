import Help from "./help.js";
import { addLine, onChange, loadPrefix, sleepAsync } from "../content/js/terminal.js";

const name = "su";

function startup(state) {
    state.commands[name].attempts = 0;
    state.commands[name].attemptedLogin = "";
}

function invokeAsync(state, args) {
    if (state.commandInjection === name) {
        return onPasswordAsync(state, args);
    }
    return onSuAsync(state, args);
}

async function onSuAsync(state, args) {
    if (!args.length) {
        return Help.invoke("su");
    }
    if (args.length > 1) {
        addLine(`Unrecognized command "${args[1]}"`)
        return state;
    }

    if (!args[0] in state.config.logins[state.currentMachineName]) {
        addLine(`Unknown User "${args[0]}"`)
        return state;
    }

    state.commands[name].attemptedLogin = args[0];

    if (state.config.logins[state.currentMachineName][args[0]] === "") {
        return success(state);
    }

    state.prefix = "Password: ";
    state.commandInjection = name;
    state.commands[name].attempts = 0;

    addLine(`Login for ${args[0]}`);

    return state;
}

function onPasswordAsync(state, args) {
    if (!args.length) {
        return failure(state);
    }
    if (args.length > 1) {
        return failure(state);
    }
    if (state.config.logins[state.currentMachineName][state.commands[name].attemptedLogin] !== args[0]) {
        return failure(state);
    }

    return success(state);
}

async function success(state) {
    state.currentLogin = state.commands[name].attemptedLogin;
    state = loadPrefix(state);
    state.commandInjection = "";
    state.commands[name].attempts = 0;
    state.commands[name].attemptedLogin = "";
    return state;
}

async function failure(state) {
    state.commands[name].attempts++;
    await sleepAsync(1000);
    if (state.commands[name].attempts >= 3) {
        addLine("su: Authentication failure");
        state.commandInjection = "";
        state.commands[name].attempts = 0;
        state.commands[name].attemptedLogin = "";
        state = loadPrefix(state);
    } else {
        addLine("Sorry, try again.");
    }

    return state;
}

function onChangeOverride(state, e) {
    var terminal = document.getElementById("terminal");
    var hiddenPrompt = document.getElementById("hidden-prompt");

    var passwordText = "*".repeat(hiddenPrompt.value.length);
    terminal.lastElementChild.innerHTML = state.prefix + passwordText;
}

function helpInfo() {

}


export default { 
    name,
    startup, 
    invokeAsync, 
    onChange: onChangeOverride,
    helpInfo 
}