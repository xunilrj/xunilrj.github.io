function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function animate(id, animType, beforeStart) {
  let selector = document.querySelector("#" + id);
  if (!selector)
    return;
  if (beforeStart)
    beforeStart(selector);
  selector.classList.add("magictime", animType);
  const e = await whenEventIsRaised(selector, "onanimationend");
  selector.classList.remove("magictime", animType);
  return e;
}
function whenEventIsRaised(obj, event) {
  return new Promise((ok, rej) => {
    obj[event] = (e) => {
      ok(e);
      obj[event] = null;
    };
  });
}
async function minWindow(button) {
  await animate("demoMenu", "tinLeftIn", (x) => x.style.display = "block");
}
async function maxWindow(button) {
  var t1 = animate("demoMenu", "tinLeftOut");
  (await t1).target.style.display = "none";
}
