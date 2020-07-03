const spinningCube = {
    idx: 0,
    name: "Spinning Cube",
    showOptions: async (e) => {
        let button = e.target;

        if (button.classList.contains("fa-cog"))
            await minWindow(e.target);
        else if (button.classList.contains("fa-pause"))
            await maxWindow(e.target);
    },
    unload: async () => {
    },
};

const demoB = {
    idx: 1,
    name: "b",
    unload: async () => {
    }
};
let available = ["spinningcube", "b"];
let demos = {
    available,
    load: async (idx, setProgress) => {
        const id = available[idx];
        const { load, Options } = await import(`./${id}/index.js`);
        await load(setProgress);
        demos[id].Options = Options;
        return demos[id];
    },
    unload: async (idx, setProgress) => {
        const id = available[idx];
        return demos[id].unload(setProgress);
    },
    "spinningcube": spinningCube,
    "b": demoB,
};

export default demos;