class EmbedYoutube extends HTMLElement {
    constructor() {
        super();                    
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() { 
        const id = this.getAttribute("id");
        this.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" width="854" height="480"></iframe>` 
    }
}
customElements.define('embed-youtube', EmbedYoutube, {  });