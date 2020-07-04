import { h, hydrate, Fragment } from 'preact';
import { useState } from 'preact/hooks';
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

function DemoMenu() {
    const [state, currentDemo, progress, progressMessage, setDemo]
        = useAsyncLoadUnloadState(0,
            demos.load,
            demos.unload);

    const hasPrevious = currentDemo && currentDemo.idx > 0;
    const hasNext = currentDemo && currentDemo.idx < demos.available.length - 1;

    const [optionsVisible, setOptionsVisibility] = useState(false);
    const toggleOptions = () => setOptionsVisibility(!optionsVisible);
    return <>
        <div style="float:right">
            <div style="text-align: center;">
                <span>{currentDemo && currentDemo.name} &nbsp;</span>
                <span>{!currentDemo && progressMessage} &nbsp;</span>
            </div >
            <MenuBar>
                {hasPrevious && <MenuBarItem
                    icon="fa-arrow-left"
                    text="Previous"
                    onClick={() => setDemo(currentDemo.idx - 1)} />
                }
                <MenuBarItem icon="fa-cog" text="Options" onClick={toggleOptions} />
                {hasNext && <MenuBarItem
                    icon="fa-arrow-right"
                    text="Next"
                    onClick={() => setDemo(currentDemo.idx + 1)} />
                }
            </MenuBar>
        </div>
        {currentDemo && currentDemo.Options && <currentDemo.Options visible={optionsVisible} />}
    </>
}



function App() {
    return <>
        <canvas id="backgroundCanvas" style="width: 100vw; height: 100vh;position: absolute;z-index:-1">
        </canvas>
        <div style="height: 10vh;">
            <div style="padding: 10px">
                <Header text="Daniel Frederico Lins Leite" />
                <Menu />
                <DemoMenu />
            </div>
        </div>
    </>;
}

hydrate(<App />, document.getElementById("app"));