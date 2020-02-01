class AutoText extends HTMLAnchorElement {
    constructor() {
        super();                    
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() { 
        if(window.location.href.startsWith("http"))
            this.innerHTML = window.location.origin + this.getAttribute("href");
        else 
            this.innerHTML = this.getAttribute("href");
    }
}
customElements.define('auto-text', AutoText, { extends: "a" });