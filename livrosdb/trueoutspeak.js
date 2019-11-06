var fs = require('fs');
var csvParse = require("csv-parse/lib/sync");
var parser = require('subtitles-parser');


function padLeft(number, n)
{
    return (number).toLocaleString('en-US', {minimumIntegerDigits: n, useGrouping:false})
}

var books = {};
var csv = fs.readFileSync("./books.csv", 'utf8');
csvParse(csv,{columns:["name","isbn","author"], delimiter: ';', bom: true}).forEach(x => {
    books[x.isbn] = x;
});

var html = [];
function insertHeader(html)
{
html.push(`
<html>
<head>
<!-- For Google -->
<meta name="description" content="Índice do TrueOutspeak - Programa de rádio do Olavo de Carvalho" />
<meta name="keywords" content="olavo, carvalho" />

<!-- For Facebook -->
<meta property="og:title" content="Índice do TrueOutspeak - Programa de rádio do Olavo de Carvalho" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://duckduckgo.com/i/7dddcd52.jpg" />
<meta property="og:url" content="http://xunilrj.github.io/trueoutspeak.html" />
<meta property="og:description" content="Programa de rádio do Olavo de Carvalho" />

<!-- For Twitter -->
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Índice do TrueOutspeak - Programa de rádio do Olavo de Carvalho" />
<meta name="twitter:description" content="Programa de rádio do Olavo de Carvalho" />
<meta name="twitter:image" content="https://duckduckgo.com/i/7dddcd52.jpg" />
</head>
<script>
function embedmp3(element, file, startAt, force) {
    clearInterval(window.interval);

    if(window.episodeEl) {
    var allchapters = window.episodeEl.querySelectorAll("[data-chapterstart]");
        allchapters.forEach(function(x){
            x.style.backgroundColor = "white";
        });
    }

    if(force) {
        window.soundFile = null;
    }

    if(window.soundFile)
    {
        window.soundFile.currentTime = startAt;
        return;
    }

    var soundFile = document.createElement("video");
    soundFile.preload = "auto";
    soundFile.controls = true;
    soundFile.style = "width: 600px;";

    var src = document.createElement("source");
    src.src = file;    
    soundFile.appendChild(src);

    var holder = document.querySelector(".audioholder");
    holder.innerHTML = "";
    holder.appendChild(soundFile);

    soundFile.load();

    if(startAt)
        soundFile.currentTime = startAt;

    soundFile.play();

    window.soundFile = soundFile;
    window.episodeEl = document.querySelector(\`[data-episodeurl=\"\${file}\"\`);

    window.interval = setInterval(function(){
        var currentTime = soundFile.currentTime;
        console.log(currentTime);
        var allchapters = window.episodeEl.querySelectorAll("[data-chapterstart]");
        allchapters.forEach(function(x){
            x.style.backgroundColor = "white";
        });
        var i;
        for(i=0;i<allchapters.length;++i){
            var current = allchapters[i];
            var startTime = parseInt(current.dataset.chapterstart);
            if(currentTime < startTime) break;
        }
        if((i > 0)&&(i<=allchapters.length))
        {
            var current = allchapters[i - 1];
            current.style.backgroundColor = "#ffffcc";
        }
    }, 1000);
}
</script>
`);
}
insertHeader(html);

html.push(`<script src="https://unpkg.com/lunr/lunr.js"></script>`);
html.push(`<body style="margin-top:200px">`);
html.push(`<div style="background:white;position:fixed;top:0;left:60vw;width:100vw;height:150px;border: dashed 1px;overflow:auto;padding:10px">`);
html.push(`<div>Buscar assunto: </div>`);
html.push(`<input id="searchInput"></input> <button id="nextbutton">Next</button> <span id="currentResult"></span>`);
html.push(`<ul id="searchResult"></ul>`);
html.push(`<div class="audioholder"><audio></audio></div>`);
html.push(`</div>`);

function insertEpisode(year, month, day, file, html, transcription = false)
{
    var url = `http://www.machinaaurum.com/trueoutspeak/TrueOutspeak%20${padLeft(day, 2)}%20${padLeft(month, 2)}%20${padLeft(year, 4)}.mp4`;
    var vtt = `D:/courses/sites/OlavoDeCarvalho/TrueOutspeak/fromyoutube/TrueOutspeak ${padLeft(day, 2)} ${padLeft(month, 2)} ${padLeft(year, 4)}.pt.srt`;
    //var url = `http://www.blogtalkradio.com/olavo/${padLeft(year, 4)}/${padLeft(month, 2)}/${padLeft(day, 2)}/true-outspeak.mp3?localembed=download`;
    
    var json = {};
    var specialFile = `trueoutspeak/${padLeft(year, 4)}.${padLeft(month, 2)}.${padLeft(day, 2)}.json`;
    if(fs.existsSync(specialFile))
    {
        var contents = fs.readFileSync(specialFile, 'utf8');
        json.chapters = JSON.parse(contents);
    } else {
        var contents = fs.readFileSync(`trueoutspeak/${file}`, 'utf8');
        json = JSON.parse(contents);
    }

    if(!json.chapters) return;

    html.push(`<div>\n`);
    html.push(`<a href="/livrosdb/episodes/${padLeft(year, 4)}-${padLeft(month, 2)}-${padLeft(day, 2)}.html"><h1 id="${padLeft(year, 4)}-${padLeft(month, 2)}-${padLeft(day, 2)}">${padLeft(year, 4)}/${padLeft(month, 2)}/${padLeft(day, 2)}</h1></a>\n`);
    html.push(`<button onclick='embedmp3(this.parentNode, "${url}")'>Ouvir este episódio</button>\n`);
    html.push(`</div>\n`);
    html.push(`<div data-episodeurl="${url}">\n`);

    function toSeconds(hms)
    {
        var a = hms.split(':'); // split it at the colons
        var s = a[2].split(",")[0];
        return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+s); 
    }
    var vttchapters;
    try
    {
        var srt = fs.readFileSync(vtt,'utf8');
        vttchapters = parser.fromSrt(srt);
        vttchapters.forEach(x => {
            x.startTime = toSeconds(x.startTime);
            x.endTime = toSeconds(x.endTime);
        });
    }
    catch(e)
    {
        //console.error(e)
    }

    json.chapters.forEach((x,i) => {
        var endTime = json.chapters[i+1];
        if(!endTime) endTime = 9999999999;
        else endTime = endTime.end_time;

        var id = `${padLeft(year, 4)}-${padLeft(month, 2)}-${padLeft(day, 2)}-${i}`;
        html.push(`<div data-chapterid="${id}" data-chapterstart="${x.start_time}">\n`);
        html.push(`<button onclick="embedmp3(document.querySelector('.audioholder'), '${url}', ${x.start_time});">Ouvir esta parte</button>\n`);
        html.push(`<p><ul>\n`);
        x.title.split(";").forEach(xx => {
            var txt = xx.trim()
            txt = txt
                .replace(/^(?!:\/\/)www\./g,"http://www.")
                .replace(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g,
            `<a href="$1">$1</a>(<a href="http://web.archive.org/web/${padLeft(year, 4)}${padLeft(month, 2)}${padLeft(day, 2)}00000/$1" target="_blank">@webarchive</a>)`);

            html.push(`<li>${txt}</li>\n`);
        });
        if(x.content)
        {
            x.content.forEach(xx => {
                if(xx.isbn){
                    var book = books[xx.isbn];
                    html.push(`<div style="padding: 10px">`);
                        html.push(`<div style="display: inline-block">`);
                            html.push(`<img src="./covers/${xx.isbn}.jpg" width="100px">`);
                        html.push(`</div>`);
                        html.push(`<div style="display: inline-block; vertical-align:top">`);
                            html.push(`<div>`);
                                html.push(`<strong><a href="./pages/${xx.isbn}/index.html">${book.name}</a></strong>`);
                            html.push(`</div>`);
                            html.push(`<div style="display: block; vertical-align:top">`);
                                html.push(`<span>${book.author}</strong>`);
                            html.push(`</div>`);
                            html.push(`<div>`);
                                html.push(`<div id="gr_add_to_books">`);
                                    html.push(`<div class="gr_custom_each_container_">`);
                                        html.push(`<a target="_blank" style="border:none" rel="nofollow noopener noreferrer" href="https://www.goodreads.com/book/isbn/${xx.isbn}"><img src="https://www.goodreads.com/images/atmb_add_book-70x25.png" /></a>`);
                                    html.push(`</div>`);
                                html.push(`</div>`);
                            html.push(`</div>`);
                        html.push(`</div>`);                        
                    html.push(`</div>`);
                }

            });
            html.push("</ol>");
        }
        html.push(`</ul></p>\n`);
        html.push(`</div>\n`);

        if(transcription && vttchapters){
            html.push(`<p><strong>Texto extraído automaticamente do vídeo. Espere baixa qualidade.</strong></p>`);
            html.push(`<p>\n`);
            var subtitles = vttchapters.filter(xx => xx.startTime >= x.start_time && xx.endTime <= endTime )
            //console.log(x.start_time, endTime, subtitles);
            var lastText;
            subtitles.forEach(x => {
                var t = x.text.trim().replace("\n","").replace(lastText,"");
                if(t.length == 0) return;
                lastText = t;
                html.push(`<div>`);
                html.push(lastText);
                html.push(`</div>`);
                
            });
            html.push(`</p>\n`);
        }
    });
    html.push(`</div>`);
}

fs.readdirSync("trueoutspeak").forEach(x => {
    var year = 2006;
    var month = 12;
    var day = 04
    var r = x.match(/\d\d\d (?<YEAR>\d\d\d\d)-(?<MONTH>\d\d)-(?<DAY>\d\d) Olavo de Carvalho-............info.json/);

    var episodehtml = [];
    insertHeader(episodehtml);
    episodehtml.push(`<div class="audioholder"><audio></audio></div>`);

    if(r && r.index === 0)
    {
        insertEpisode(r.groups.YEAR, r.groups.MONTH, r.groups.DAY, x, html);
        insertEpisode(r.groups.YEAR, r.groups.MONTH, r.groups.DAY, x, episodehtml, true);
        fs.writeFileSync(`episodes/${r.groups.YEAR}-${r.groups.MONTH}-${r.groups.DAY}.html`, episodehtml.join(""));
    }
    var r = x.match(/True( )?Outspeak -( Olavo de Carvalho -)? (?<DAY>\d?\d) de (?<MONTH>[a-zA-Zç]+?) de (?<YEAR>\d\d\d\d)(.*?).json/);
    if(r && r.index === 0)
    {
        if(r.groups.MONTH == "janeiro") r.groups.MONTH = 1;
        if(r.groups.MONTH == "fevereiro") r.groups.MONTH = 2;
        if(r.groups.MONTH == "março") r.groups.MONTH = 3;
        if(r.groups.MONTH == "abril") r.groups.MONTH = 4;
        if(r.groups.MONTH == "maio") r.groups.MONTH = 5;
        if(r.groups.MONTH == "junho") r.groups.MONTH = 6;
        if(r.groups.MONTH == "julho") r.groups.MONTH = 7;
        if(r.groups.MONTH == "agosto") r.groups.MONTH = 8;
        if(r.groups.MONTH == "setembro") r.groups.MONTH = 9;
        if(r.groups.MONTH == "outubro") r.groups.MONTH = 10;
        if(r.groups.MONTH == "novembro") r.groups.MONTH = 11;
        if(r.groups.MONTH == "dezembro") r.groups.MONTH = 12;
        insertEpisode(r.groups.YEAR, r.groups.MONTH, r.groups.DAY, x, html);
        
        insertEpisode(r.groups.YEAR, r.groups.MONTH, r.groups.DAY, x, episodehtml, true);
        fs.writeFileSync(`episodes/${r.groups.YEAR}-${r.groups.MONTH}-${r.groups.DAY}.html`, episodehtml.join(""));
    }
    
});

html.push(`<script>
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  lunrStore = {};
var idx = lunr(function () {
    this.ref('id')
    this.field('text')
    this.field('url')
    document.querySelectorAll("li").forEach(function (item) {
        item.dataset.searchid = uuidv4();
        var url = item.parentNode.parentNode.parentNode.dataset.episodeurl;    
        var obj = {
            id: item.dataset.searchid,
            text: item.innerText.toLowerCase(),
            url: url,
        };
        lunrStore[obj.id] = obj;
        this.add(obj);
    }, this);
});

function showResult(result, i)
{
    var el = document.querySelector("[data-searchid='"+window.searchResult[i].ref+"']");
    el.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center'
    });
    
    var obj = lunrStore[window.searchResult[i].ref];
    var startAt = parseInt(el.parentNode.parentNode.dataset.chapterstart);
    embedmp3(el.parentNode.parentNode.parentNode, obj.url, startAt, true);

    el = document.getElementById('currentResult');
    el.innerText = (i+1) + "/" + result.length;
}

document.getElementById("searchInput")
.addEventListener("input", function(e) {
    var result = idx.search(e.target.value);
    window.searchResult = result;
    window.searchResulti = 0;
    
    var rel = document.getElementById("searchResult");
    rel.innerHTML = "";
    
    if(result.length > 0) showResult(window.searchResult, 0);
});  

document.getElementById("nextbutton")
    .addEventListener("click", function() {
        ++window.searchResulti;
        showResult(window.searchResult, window.searchResulti);
    });

if(window.URLSearchParams) {
    var urlParams = new URLSearchParams(window.location.search);
    var episode = urlParams.get('episode');
    var el = document.querySelector("h1#" + CSS.escape(episode));
    el.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center'
    });
    el.style.background = "lightgrey";
}
</script>
</body>
</html>`);
var chapters = `../trueoutspeak.html`;
fs.writeFileSync(chapters, html.join(""));