import {h, hydrate, Fragment} from "/web_modules/preact.js";
import {useState} from "/web_modules/preact/hooks.js";
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
function DemoMenu() {
  const [state, currentDemo, progress, progressMessage, setDemo] = useAsyncLoadUnloadState2(0, demos2.load, demos2.unload);
  const hasPrevious = currentDemo && currentDemo.idx > 0;
  const hasNext = currentDemo && currentDemo.idx < demos2.available.length - 1;
  const [optionsVisible, setOptionsVisibility] = useState(false);
  const toggleOptions = () => setOptionsVisibility(!optionsVisible);
  return h(Fragment, null, h("div", {
    style: "float:right"
  }, h("div", {
    style: "text-align: center;"
  }, h("span", null, currentDemo && currentDemo.name, "  "), h("span", null, !currentDemo && progressMessage, "  ")), h(MenuBar, null, hasPrevious && h(MenuBarItem, {
    icon: "fa-arrow-left",
    text: "Previous",
    onClick: () => setDemo(currentDemo.idx - 1)
  }), h(MenuBarItem, {
    icon: "fa-cog",
    text: "Options",
    onClick: toggleOptions
  }), hasNext && h(MenuBarItem, {
    icon: "fa-arrow-right",
    text: "Next",
    onClick: () => setDemo(currentDemo.idx + 1)
  }))), currentDemo && currentDemo.Options && h(currentDemo.Options, {
    visible: optionsVisible
  }));
}
function App() {
  return h(Fragment, null, h("canvas", {
    id: "backgroundCanvas",
    style: "width: 100vw; height: 100vh;position: absolute;z-index:-1"
  }), h("div", {
    style: "height: 10vh;"
  }, h("div", {
    style: "padding: 10px"
  }, h(Header, {
    text: "Daniel Frederico Lins Leite"
  }), h(Menu, null), h(DemoMenu, null))));
}
hydrate(h(App, null), document.getElementById("app"));
