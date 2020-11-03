import {h, hydrate, Fragment} from "/web_modules/preact.js";
import {useState, useEffect} from "/web_modules/preact/hooks.js";
import demos2 from "./demos.js";
import {MenuBar, MenuBarItem} from "./menuBar.js";
import useAsyncLoadUnloadState2 from "./useAsyncLoadUnloadState.js";
function Header({text}) {
  return h("h1", {
    style: "display: inline;font-family: Indie Flower;"
  }, text);
}
function Menu() {
  return h("menu", {
    class: "menu-bar menu-bar--expanded@md js-menu-bar"
  }, h("li", {
    id: "minimizedWindow",
    class: "menu-bar__item menu-bar__item--hide",
    role: "menuitem",
    style: "display: none;"
  }, h("i", {
    class: "far fa-window-maximize"
  }), h("span", {
    class: "menu-bar__label"
  }, "/CV/articles")));
}
function DemoMenu({demo, navigatePreviousDemo, navigateNextDemo}) {
  if (!demo)
    return h(Fragment, null);
  const hasPrevious = demo && demo.idx > 0;
  const hasNext = demo && demo.idx < demos2.available.length - 1;
  const [optionsVisible, setOptionsVisibility] = useState(false);
  const toggleOptions = () => setOptionsVisibility(!optionsVisible);
  return h(Fragment, null, h("div", {
    style: "float:right"
  }, h("div", {
    style: "text-align: center;"
  }, h("span", null, demo && demo.name, "  "), h("span", null, !demo && progressMessage, "  ")), h(MenuBar, null, hasPrevious && h(MenuBarItem, {
    icon: "fa-arrow-left",
    text: "Previous",
    onClick: navigatePreviousDemo
  }), h(MenuBarItem, {
    icon: "fa-cog",
    text: "Options",
    onClick: toggleOptions
  }), hasNext && h(MenuBarItem, {
    icon: "fa-arrow-right",
    text: "Next",
    onClick: navigateNextDemo
  }))), demo && demo.Options && h(demo.Options, {
    visible: optionsVisible
  }));
}
function App() {
  let initialDemo = 0;
  var patt = new RegExp(/demo-(?<DEMOID>\d+)/i).exec(window.location.href);
  if (patt.groups && patt.groups.DEMOID) {
    initialDemo = parseInt(patt.groups.DEMOID);
  }
  const [state, currentDemo, progress, progressMessage2, setDemo] = useAsyncLoadUnloadState2(initialDemo, demos2.load, demos2.unload);
  useEffect(() => {
    if (currentDemo && currentDemo.load)
      currentDemo.load();
  }, [currentDemo]);
  const navigatePreviousDemo = () => setDemo(currentDemo.idx - 1);
  const navigateNextDemo = () => setDemo(currentDemo.idx + 1);
  return h(Fragment, null, currentDemo && currentDemo.Main && h(currentDemo.Main, null), h("div", {
    style: "height: 10vh;"
  }, h("div", {
    style: "padding: 10px"
  }, h(Header, {
    text: "Daniel Frederico Lins Leite"
  }), h(Menu, null), h(DemoMenu, {
    demo: currentDemo,
    navigateNextDemo,
    navigatePreviousDemo
  }))));
}
hydrate(h(App, null), document.getElementById("app"));
