class LinkBook extends HTMLElement {
    constructor() {
        super();                    
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() { 
        const isbn = this.getAttribute("isbn");
        const title = this.getAttribute("title");
        this.innerHTML = `<a href="https://xunilrj.github.io/pages/${isbn}/index.html">${title}</a>`
    }
}
customElements.define('link-book', LinkBook, {  });