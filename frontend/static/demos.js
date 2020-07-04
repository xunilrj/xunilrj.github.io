let available = ["spinningcube", "sudoku"];
let demos = {
    available,
    load: async (idx, setProgress) => {
        const id = available[idx];
        const { load, unload, Main, Options } = await import(`./${id}/index.js`);
        // await load(setProgress);
        demos[id].Main = Main;
        demos[id].Options = Options;
        demos[id].load = load;
        demos[id].unload = unload;
        return demos[id];
    },
    unload: async (idx, setProgress) => {
        const id = available[idx];
        if (demos && demos[id] && demos[id].unload)
            return demos[id].unload(setProgress);
    },
    "spinningcube": {
        idx: 0,
        name: "Spinning Cube"
    },
    "sudoku": {
        idx: 1,
        name: "Sudoku"
    },
};

export default demos;