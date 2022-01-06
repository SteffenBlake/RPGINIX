import Help from "./help.js";
import { addLine } from "../content/js/terminal.js";
import Posix from "../content/js/path-browserify.js";

const name = "cd";

function startup(state) {
}

function invoke(state, args) {
    if (!args.length) {
        return Help.invoke("cd");
    }
    if (args.length > 1) {
        return unrecognized(args[1]);
    }

    var targetPath = Posix.resolve(state.currentDir, args[0]);

    if (Object.keys(state.machines[state.currentMachine]).some(dir => 
        dir === targetPath && state.machines[state.currentMachine][dir] === 'tree'
    ))
    {
        state.currentDir = targetPath;
    } else {
        addLine($`Unrecognized path: '${targetPath}'`)
    }

    return state;
}

function helpInfo() {

}


export default { 
    name,
    startup, 
    invoke, 
    helpInfo 
}