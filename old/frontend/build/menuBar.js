import {h, hydrate, Fragment} from "/web_modules/preact.js";
import {useRef, useEffect} from "/web_modules/preact/hooks.js";
var MenuBarObject = function(element) {
  this.element = element;
  this.items = Util.getChildrenByClassName(this.element, "menu-bar__item");
  this.mobHideItems = this.element.getElementsByClassName("menu-bar__item--hide");
  this.moreItemsTrigger = this.element.getElementsByClassName("js-menu-bar__trigger");
  initMenuBar(this);
};
function initMenuBar(menu) {
  setMenuTabIndex(menu);
  initMenuBarMarkup(menu);
  checkMenuLayout(menu);
  Util.addClass(menu.element, "menu-bar--loaded");
  menu.element.addEventListener("update-menu-bar", function(event) {
    checkMenuLayout(menu);
    menu.menuInstance.toggleMenu(false, false);
  });
  if (menu.moreItemsTrigger.length > 0) {
    menu.moreItemsTrigger[0].addEventListener("keydown", function(event) {
      if (event.keyCode && event.keyCode == 13 || event.key && event.key.toLowerCase() == "enter") {
        menu.menuInstance.selectedTrigger = menu.moreItemsTrigger[0];
        menu.menuInstance.toggleMenu(!Util.hasClass(menu.subMenu, "menu--is-visible"), true);
      }
    });
    menu.subMenu.addEventListener("keydown", function(event) {
      if (event.keyCode && event.keyCode == 27 || event.key && event.key.toLowerCase() == "escape") {
        menu.menuInstance.toggleMenu(false, true);
      }
    });
  }
  menu.element.addEventListener("keydown", function(event) {
    if (event.keyCode && event.keyCode == 39 || event.key && event.key.toLowerCase() == "arrowright") {
      navigateItems(menu.items, event, "next");
    } else if (event.keyCode && event.keyCode == 37 || event.key && event.key.toLowerCase() == "arrowleft") {
      navigateItems(menu.items, event, "prev");
    }
  });
}
;
function setMenuTabIndex(menu) {
  var nextItem = false;
  for (var i = 0; i < menu.items.length; i++) {
    if (i == 0 || nextItem)
      menu.items[i].setAttribute("tabindex", "0");
    else
      menu.items[i].setAttribute("tabindex", "-1");
    if (i == 0 && menu.moreItemsTrigger.length > 0)
      nextItem = true;
    else
      nextItem = false;
  }
}
;
function initMenuBarMarkup(menu) {
  if (menu.mobHideItems.length == 0) {
    if (menu.moreItemsTrigger.length > 0)
      menu.element.removeChild(menu.moreItemsTrigger[0]);
    return;
  }
  if (menu.moreItemsTrigger.length == 0)
    return;
  var content = "";
  menu.menuControlId = "submenu-bar-" + Date.now();
  for (var i = 0; i < menu.mobHideItems.length; i++) {
    var item = menu.mobHideItems[i].cloneNode(true), svg = item.getElementsByTagName("svg")[0], label = item.getElementsByClassName("menu-bar__label")[0];
    svg.setAttribute("class", "icon menu__icon");
    content = content + '<li role="menuitem"><span class="menu__content js-menu__content">' + svg.outerHTML + "<span>" + label.innerHTML + "</span></span></li>";
  }
  Util.setAttributes(menu.moreItemsTrigger[0], {
    role: "button",
    "aria-expanded": "false",
    "aria-controls": menu.menuControlId,
    "aria-haspopup": "true"
  });
  var subMenu = document.createElement("menu"), customClass = menu.element.getAttribute("data-menu-class");
  Util.setAttributes(subMenu, {
    id: menu.menuControlId,
    class: "menu js-menu " + customClass
  });
  subMenu.innerHTML = content;
  document.body.appendChild(subMenu);
  menu.subMenu = subMenu;
  menu.subItems = subMenu.getElementsByTagName("li");
  menu.menuInstance = new Menu(menu.subMenu);
}
;
function checkMenuLayout(menu) {
  var layout = getComputedStyle(menu.element, ":before").getPropertyValue("content").replace(/\'|"/g, "");
  Util.toggleClass(menu.element, "menu-bar--collapsed", layout == "collapsed");
}
;
function navigateItems(list, event, direction, prevIndex) {
  event.preventDefault();
  var index = typeof prevIndex !== "undefined" ? prevIndex : Util.getIndexInArray(list, event.target), nextIndex = direction == "next" ? index + 1 : index - 1;
  if (nextIndex < 0)
    nextIndex = list.length - 1;
  if (nextIndex > list.length - 1)
    nextIndex = 0;
  list[nextIndex].offsetParent === null ? navigateItems(list, event, direction, nextIndex) : Util.moveFocus(list[nextIndex]);
}
;
function checkMenuClick(menu, target) {
  if (menu.menuInstance && !menu.moreItemsTrigger[0].contains(target) && !menu.subMenu.contains(target))
    menu.menuInstance.toggleMenu(false, false);
}
;
export function MenuBarItem({icon, text, onClick}) {
  return h(Fragment, null, h("li", {
    class: "menu-bar__item menu-bar__item--hide",
    role: "menuitem",
    onClick
  }, h("i", {
    className: "fas " + icon
  }), h("span", {
    class: "menu-bar__label"
  }, text)));
}
export function MenuBar({children}) {
  let ref = useRef(null);
  useEffect(() => {
    setupMenuBar(ref.current);
  });
  return h(Fragment, null, h("menu", {
    ref,
    class: "menu-bar menu-bar--expanded@md js-menu-bar"
  }, children));
}
function setupMenuBar(menuBar) {
  var beforeContent = getComputedStyle(menuBar, ":before").getPropertyValue("content");
  if (beforeContent && beforeContent != "" && beforeContent != "none") {
    return new MenuBarObject(menuBar);
  }
}
