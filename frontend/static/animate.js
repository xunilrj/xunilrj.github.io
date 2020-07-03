function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animate(id, animType, beforeStart) {
    let selector = document.querySelector('#' + id);
    if (!selector) return;
    if (beforeStart) beforeStart(selector);

    selector.classList.add('magictime', animType);
    const e = await whenEventIsRaised(selector, "onanimationend");
    selector.classList.remove('magictime', animType);
    return e;
}

function whenEventIsRaised(obj, event) {
    return new Promise((ok, rej) => {
        obj[event] = (e) => {
            ok(e);
            obj[event] = null;
        }
    });
}

async function minWindow(button) {
    // button.classList.remove("fa-play");
    // button.classList.add("fa-pause");
    // let t1 = animate('text', 'puffOut'); await sleep(200);
    // let t2 = animate('minimizedWindow', 'puffIn', x => x.style.display = "flex");

    // (await t1).target.style.display = "none";
    // await t2;

    await animate('demoMenu', 'tinLeftIn', x => x.style.display = "block");
}

async function maxWindow(button) {
    // button.classList.remove("fa-pause");
    // button.classList.add("fa-play");

    var t1 = animate('demoMenu', 'tinLeftOut');
    // let t2 = animate('minimizedWindow', 'puffOut'); await sleep(200);
    // let t3 = animate('text', 'puffIn', x => x.style.display = "block");

    (await t1).target.style.display = "none";
    // (await t2).target.style.display = "none";
    // await t3;
}