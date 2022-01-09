import { addLine } from "../content/js/terminal.js";

const name = "ul";

function startup(state) {
}

async function invokeAsync(state, args) {
    if (args.length) {
        addLine(`Unrecognized argument "${args[0]}"`);
        return state;
    }

    var logins = state.config.logins[state.currentMachineName];

    Object.keys(logins).forEach(addLine);

    return state;
}

function helpInfo() {

}


export default { 
    name,
    startup, 
    invokeAsync, 
    helpInfo 
}