import {useState} from "/web_modules/preact/hooks.js";
async function loadUnload(oldValue, newValue, load, oldUnload, newUnload, set, token, setProgress) {
  if (token.cancel)
    return;
  if (oldUnload)
    await oldUnload(oldValue, setProgress);
  if (token.cancel)
    return;
  let xx = await load(newValue, setProgress);
  if (token.cancel)
    return;
  set({
    unload: newUnload,
    state: "loaded",
    value: xx,
    firstTime: false
  });
}
export default function useAsyncLoadUnloadState(initialValue, load, unload) {
  const [v, set] = useState({
    unload,
    firstTime: true
  });
  let token = {
    cancel: false
  };
  let setProgress = (x, str) => {
    set({
      unload,
      state: "loading",
      progress: x,
      message: str,
      firstTime: false
    });
  };
  let setNewValue = (newValue) => {
    token.cancel = true;
    set({
      unload,
      state: "loading",
      firstTime: false
    });
    token = {
      cancel: false
    };
    loadUnload(v.value.idx, newValue, load, v.unload, unload, set, token, setProgress);
  };
  if (v.firstTime) {
    load(initialValue, setProgress).then((x) => {
      if (token.cancel)
        return;
      set({
        unload,
        state: "loaded",
        value: x,
        firstTime: false
      });
    });
    return ["loading", null, setNewValue];
  }
  return [v.state, v.value, v.progress, v.message, setNewValue];
}
