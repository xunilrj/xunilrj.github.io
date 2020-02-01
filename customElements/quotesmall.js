class QuoteSmall extends HTMLElement {
    constructor() {
        super();                    
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() { 
        const title = this.getAttribute("title");
        let href = this.getAttribute("href");
        if(window.location.href.startsWith("http"))
            href = window.location.origin + this.getAttribute("href");
        else 
            href = this.getAttribute("href");
        this.innerHTML = `<div class="on-hover">
    <a href="${href}">${title}</a>
    <div class="on-hover-display-me" style="position: absolute; padding: 10px; margin-left: 520px; max-width: 300px; overflow: scroll">
    <div>${title}</div><a href="${href}">${href}</a>
    </div>
</div>`;
        this.style.textAlign = "right";

        var onHoverDisplay = document.head.children.namedItem("onHoverDisplay");
        if(!onHoverDisplay) {
            var styles = `
            .on-hover .on-hover-display-me
            {
                opacity: 0%;
                transform:translateY(-100%);
                transition: opacity 2s;
            }
            .on-hover:hover .on-hover-display-me
            {
                opacity: 100%;                
                transform:translateY(-100%);
                border: solid 1px black;
                background: white;
                z-index: 1;
            }`;
    
            var styleSheet = document.createElement("style")
            styleSheet.id = "onHoverDisplay";
            styleSheet.type = "text/css"
            styleSheet.innerText = styles
            document.head.appendChild(styleSheet)
        }
    }
}
customElements.define('quote-small', QuoteSmall, {  });