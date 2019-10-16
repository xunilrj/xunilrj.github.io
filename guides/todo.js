String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

window.todo = function(name, el, items)
{
    var obj;
    var localStorageKey = name;

    try {
        obj = localStorage.getItem(localStorageKey);
    } catch {}
    if(!obj) obj = "";
    if(obj) obj = JSON.parse(obj);

    items.forEach(x => {
        var title = x[0];
        var url = x[1];
        var urlHash = x[1].hashCode();
        var checked = !!obj[urlHash];
        
        var root = document.createElement("div");
        root.innerHTML = `<h3>${title}</h3><input type="checkbox" ${checked ? "checked": ""} data-url-hash="${urlHash}"/><a href="${url}">${url}</a>`;

        el.append(root);
    });
    el.addEventListener("input", function(e){
        obj[e.target.dataset.urlHash] = e.target.checked;
        try{
            var json = JSON.stringify(obj);
            localStorage.setItem(localStorageKey, json);
        }catch {}
    });
}