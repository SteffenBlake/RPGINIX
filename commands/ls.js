import { addLine } from "../content/js/terminal.js";
import Posix from "../content/js/path-browserify.js";

const name = "ls";

function startup(state) {

}

function invoke(state, args) {
    if (args.length > 1) {
        return unrecognized(args[1]);
    }

    var targetPath = state.currentDir;

    if (args.length) {
        targetPath = Posix.resolve(currentDir, args[0]);
    }

    if (!targetPath.endsWith("/"))
        targetPath += "/";

    var results = [`<span class="tree">.</span>`];
    var depth = targetPath.split("/").filter(s => s.length).length;
    var machineDirs = state.machines[state.currentMachine];
    var matchingDirs = Object.keys(machineDirs).filter(dir => dir.path.startsWith(currentDir));

    if (!matchingDirs.length) {
        addLine(`Unrecognized path "${targetPath}"`)
        return state;
    }

    if (depth > 1) {
        results.push(`<span class="tree">..</span>`);
    }

    matchingDirs.forEach(dir => {
        var dirDepth = dir.split("/").filter(s => s.length).length;
        if (dirDepth <= depth)
            return;

        if (dirDepth > depth+1 && machineDirs[dir] === 'blob')
            return;

        var subDir = dir.replace(targetPath, '').split("/")[0];
        results.push(`<span class="${machineDirs[dir]}">${subDir}</span>`);
    });

    var layers = results.distinct().chunk(4).map(row => row.join(""));

    var output = "<div class='ls'>" + layers.join("</div><div class='ls'>") + "</div>";
    addLine(output);

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