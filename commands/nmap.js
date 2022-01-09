import { addLine, sleepAsync } from "../content/js/terminal.js";

const name = "nmap";

function startup(state) {
}

async function invokeAsync(state, args) {
    if (args.length) {
        addLine(`Unrecognized argument "${args[0]}"`);
        return state;
    }
    var machines = Object.keys(state.config.logins)

    addLine(`Starting Nmap...`);
    addLine(`Nmap scan report for ${state.currentMachineName}`);
    await sleepAsync(1000);
    var latency = Math.random().toFixed(3);
    addLine(`Host is up (${latency}s latency).`);

    var timeToScan = 0;

    for (var m = 0; m < machines.length; m++) {
        var machine = machines[m];
        var delay = Math.random() * 1000;
        timeToScan+=delay;
        await sleepAsync(1000);
        addLine(machine);
    }

    timeToScan = (timeToScan / 1000).toFixed(2);

    addLine(`Nmap done: 256 IP addresses (${machines.length} host(s) up) scanned in ${timeToScan} seconds`);

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