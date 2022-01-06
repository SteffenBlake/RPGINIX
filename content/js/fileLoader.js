export default {
    async fetchDirectories(username, repo, branch) {
        var url = `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`
        var dirResp = await fetch(url);
        var json = await dirResp.json();
    
        return json.tree;
    },

    async fetchJson(path) {
        var response = await fetch(path);
        return await response.json();
    }
}