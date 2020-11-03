import { h, hydrate, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import demos from './demos.js';
import { MenuBar, MenuBarItem } from './menuBar.jsx';
import useAsyncLoadUnloadState from './useAsyncLoadUnloadState.js';

function Header({ text }) {
    return <h1 style="display: inline;font-family: Indie Flower;">{text}</h1>;
}

function Menu() {
    return <menu class="menu-bar menu-bar--expanded@md js-menu-bar">
        <li id="minimizedWindow" class="menu-bar__item menu-bar__item--hide" role="menuitem"
            style="display: none;">
            <i class="far fa-window-maximize"></i>
            <span class="menu-bar__label">/CV/articles</span>
        </li>
    </menu>;
}

function DemoMenu({ demo, navigatePreviousDemo, navigateNextDemo }) {
    if (!demo)
        return <></>;

    const hasPrevious = demo && demo.idx > 0;
    const hasNext = demo && demo.idx < demos.available.length - 1;

    const [optionsVisible, setOptionsVisibility] = useState(false);
    const toggleOptions = () => setOptionsVisibility(!optionsVisible);
    return <>
        <div style="float:right">
            <div style="text-align: center;">
                <span>{demo && demo.name} &nbsp;</span>
                <span>{!demo && progressMessage} &nbsp;</span>
            </div >
            <MenuBar>
                {hasPrevious && <MenuBarItem
                    icon="fa-arrow-left"
                    text="Previous"
                    onClick={navigatePreviousDemo} />
                }
                <MenuBarItem icon="fa-cog" text="Options" onClick={toggleOptions} />
                {hasNext && <MenuBarItem
                    icon="fa-arrow-right"
                    text="Next"
                    onClick={navigateNextDemo} />
                }
            </MenuBar>
        </div>
        {demo && demo.Options && <demo.Options visible={optionsVisible} />}
    </>
}



function App() {
    let initialDemo = 0;
    var patt = new RegExp(/demo-(?<DEMOID>\d+)/i).exec(window.location.href);
    if (patt.groups && patt.groups.DEMOID) {
        initialDemo = parseInt(patt.groups.DEMOID);
    }

    const [state, currentDemo, progress, progressMessage, setDemo]
        = useAsyncLoadUnloadState(initialDemo,
            demos.load,
            demos.unload);
    useEffect(() => {
        if (currentDemo && currentDemo.load)
            currentDemo.load();
    }, [currentDemo]);

    const navigatePreviousDemo = () => setDemo(currentDemo.idx - 1);
    const navigateNextDemo = () => setDemo(currentDemo.idx + 1);
    return <>
        {currentDemo && currentDemo.Main && <currentDemo.Main />}
        <div style="height: 10vh;">
            <div style="padding: 10px">
                <Header text="Daniel Frederico Lins Leite" />
                <Menu />
                <DemoMenu demo={currentDemo} navigateNextDemo={navigateNextDemo} navigatePreviousDemo={navigatePreviousDemo} />
            </div>
        </div>
    </>;
}

hydrate(<App />, document.getElementById("app"));