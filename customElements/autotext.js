class AutoText extends HTMLAnchorElement {
    constructor() {
        super();                    
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() { 
        if(!window.location.href.startsWith("http"))
            this.innerHTML = window.location.origin + this.getAttribute("href");
        else 
            this.innerHTML = this.getAttribute("href");
    }
}
customElements.define('auto-text', AutoText, { extends: "a" });

class LIAutoText extends HTMLLIElement {
    constructor() {
        super();                    
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() { 
        if(!this.innerText.startsWith("http"))
        {
            var url = window.location.origin + this.getAttribute("href")
            this.innerHTML = `<a href="${url}">${url}</a>`;
        }
        else 
        {
            var url = this.getAttribute("href")
            this.innerHTML = `<a href="${url}">${url}</a>`;
        }
    }
}

customElements.define('li-auto-text', AutoText, { extends: "li" });