cd (Split-Path $PSCommandPath -Parent)

$rows = Import-CSV "livros.csv" -Delimiter ";" -Header "Livro","Autor","Descricao","D","E","DATE","StartAt","I","J" #| ogv
$rows2 = Import-CSV "livros2.csv" -Delimiter ";" -Header "Livro","Autor","Descricao","D","E","DATE","StartAt","I","J" #| ogv
$books = Import-CSV "books.csv" -Delimiter ";" -Header "name","isbn","authors"
$suggestions = Import-CSV "suggestion.csv" -Delimiter ";" -Header "from","to"
$suggestionsLinks = Import-CSV "suggestion.links.csv" -Delimiter ";" -Header "from","url","title","summary"

$dest = "D:/github/xunilrj.github.io"

function getMP3File($date) {    
    if($date -is [System.String]) {
        $date = [System.DateTime]::ParseExact($date, "yyyy-MM-dd", [System.Globalization.CultureInfo]::new("en-us")).Date
    }
    "http://www.machinaaurum.com/trueoutspeak/TrueOutspeak%20$($date.Day.ToString("D2"))%20$($date.Month.ToString("D2"))%20$($date.Year).mp4"
    #"https://www.blogtalkradio.com/olavo/$($date.Year)/$($date.Month.ToString("D2"))/$($date.Day.ToString("D2"))/true-outspeak.mp3?localembed=download"
}

function GetImage($name,$size=100,$imgPrefix = ".")
{
    $row = $books|? name -eq $name
    
    $r = Test-Path "$dest/covers/$($row.isbn).jpg"
    if($r) {
@"
<div style="display:inline-block">
    <img src="$imgPrefix/covers/$($row.isbn).jpg" width="$($size)px"/>
</div>
"@
    }
    else
    {
    }
}

function WriteSuggestion($s, $name = "to", $imgPrefix = ".", $suggestionHardLink = $false)
{
    $s|% {
        $book = $books|? isbn -eq ($_|select -ExpandProperty $name)
        $bookLink = "<div><strong><a href=""#$(GetAncherName $book.name $suggestionHardLink)"">$($book.name)</a></strong></div>"
        if($suggestionHardLink){
            if(Test-Path "../pages/$($book.isbn)/index.html") {
                $bookLink = "<div><strong><a href=""$imgPrefix/pages/$($book.isbn)/index.html"">$($book.name)</a></strong></div>"
            } else {
                $bookLink = "<div><strong>$($book.name)</strong></div>"
            }
        }
@"
        <div style="padding:20px;display:inline-block;max-width:300px">
            <div>
                $(GetImage $book.name 100 $imgPrefix)
            </div>
            <div style="display:inline-block;vertical-align:top">
                $bookLink
                <div>$($book.authors)</div>                
            </div>
        </div>    
"@
    }
}

function GetSuggestions($name, $imgPrefix = ".", $suggestionHardLink = $false )
{
    $row = $books|? name -eq $name
    $s1 = $suggestions|? from -eq $row.isbn
    $s2 = $suggestions|? to -eq $row.isbn

    $count = ($s1|Measure-Object).Count + ($s2|Measure-Object).Count
    if($count -eq 0) { return }

@"
    <div style="padding:20px">
        <div><strong>Mais livros</strong></div>
"@
    if (($s1|Measure-Object).Count -gt 0) {
        WriteSuggestion $s1 "to" $imgPrefix $suggestionHardLink
    }
    if (($s2|Measure-Object).Count -gt 0) {
        WriteSuggestion $s2 "from" $imgPrefix $suggestionHardLink
    }
@"
    </div>
"@
}

function GetLinks($name)
{
    $row = $books|? name -eq $name
    $s = $suggestionsLinks|? from -eq $row.isbn
    if (($s|Measure-Object).Count -eq 0) { return }
@"
    <div style="padding:20px">
        <div><strong>Ver também</strong></div>
        <ul>
"@
    $s|% {
@"
        <li>
"@
        if([string]::IsNullOrEmpty($_.summary) -eq $false){
            "<p>""$($_.summary.Replace("##NEWP##","</p><p>"))""</p>"
        }
        
        if($_.url.StartsWith("https://youtu.be/"))
        {
@"
            <div>
                <div>
                    <span>$($_.title) (</span><a href="$($_.url)">$($_.url)</a><span>)</span>                    
                </div>
                <button onclick="window.open('https://www.youtubnow.com/watch/?v=$($_.url.Replace("https://youtu.be/",""))','_blank')">Download</button>
                <button onclick='embedyoutube(this, "$($_.url.Replace("https://youtu.be/","https://www.youtube.com/embed/"))")'>Ver</button>                                
                <div class="youtubeholder">
                </div>
            </div>
"@
        }
        elseif($_.url.StartsWith("https://www.youtube.com/watch"))
        {
@"
            <div>
                <div>
                    <span>$($_.title) (</span><a href="$($_.url)">$($_.url)</a><span>)</span>   
                </div>
                <button onclick="window.open('https://www.youtubnow.com/watch/?v=$($_.url.Replace("https://www.youtube.com/watch?v=",""))','_blank')">Download</button>
                <button onclick='embedyoutube(this, "$($_.url.Replace("https://www.youtube.com/watch?v=","https://www.youtube.com/embed/"))")'>Ver</button>
                <div class="youtubeholder">
                </div>
            </div>
"@
        }
        elseif($_.url.EndsWith("format=mp3")){
@"
            <div>
                <div>
                    <span>$($_.title) (</span><a href="$($_.url)">$($_.url)</a><span>)</span>   
                </div>
                <button onclick='embedmp3(this, "$($_.url)")'>Ouvir</button>
                <div class="audioholder">
                </div>
            </div>
"@
        }
        else{
@"
            <span>$($_.title) (</span><a href="$($_.url)">$($_.url)</a><span>)</span>
"@
        }
@"
        </li>    
"@
    }
@"
    </ul>
    </div>
"@
}

function GetPageHeader ($title, $img, $decricao, $url) {
@"
<!DOCTYPE html>
<head>
    <script src="https://unpkg.com/lunr/lunr.js"></script>
    <title>$title</title>
    <link rel="stylesheet" href="https://unpkg.com/purecss@1.0.0/build/pure-min.css" integrity="sha384-nn4HPE8lTHyVtfCBi5yW9d20FjT8BJwUXyWZT9InLYax14RDjBj46LmSztkmNP9w" crossorigin="anonymous">
    <meta property="og:title" content="$title" />
    <meta property="og:type" content="article" />
    <meta property="og:image" content="$img" />
    <meta property="og:url" content="https://xunilrj.github.io/$url" />
    <meta property="og:description" content="$decricao" />
</head>
<body>
<script>
function embedpdf(element, file) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = function() {
        var loadingTask = pdfjsLib.getDocument(file);
        loadingTask.promise.then(function(pdf) {
            console.log(1);
        });
    }
    script.src = 'https://unpkg.com/pdfjs-dist@2.0.943/build/pdf.min.js';
    head.appendChild(script);
}

function embedyoutube(element, file, startAt) {    
    var i = document.createElement("iframe");
    i.width = "640";
    i.height = "480px"
    i.src = file;

    var holder = element.parentNode.querySelector(".youtubeholder");
    holder.innerHTML = "";
    holder.appendChild(i);
}

function embedmp3(element, file, startAt) {    
    var soundFile = document.createElement("video");
    soundFile.preload = "auto";
    soundFile.controls = true;
    soundFile.style = "width: 600px;";

    var src = document.createElement("source");
    src.src = file;    
    soundFile.appendChild(src);

    var holder = element.parentNode.querySelector(".audioholder");
    holder.innerHTML = "";
    holder.appendChild(soundFile);

    soundFile.load();

    if(startAt)
        soundFile.currentTime = startAt;

    soundFile.play();
}
function ScrollTo(book){
    if(book) {
        var el = document.querySelectorAll("[id*='" + book + "']");
        if(el[0]) el[0].scrollIntoView();
    }
}
</script>
"@
}

$indexHeader = @"
<div style="position: fixed; right: 10px; background: white; border: solid 1px; padding: 5px">
    <span>Search (Title):</span>
    <input type="text" id="searchInput"></input>
</div>
<div>    
    <h1>Miséria intelectual sem fim</h1>
    <div>Olavo de Carvalho</div>
    <div>Diário do Comércio, 15 de agosto de 2005</div>
    <div>
        <p>Sem a menor dificuldade posso listar mais de quinhentos livros importantes, que suscitaram discussões intensas e estudos sérios nos EUA e na Europa, e que permanecem totalmente desconhecidos do nosso público, pelo simples fato de que sua leitura arriscaria furar o balão da autolatria esquerdista e varrer para o lixo do esquecimento inumeráveis prestígios acadêmicos e literários consagrados neste país ao longo das últimas décadas.
        <p>Esses livros dividem-se em sete categorias principais:
        <ol>
            <li>Obras essenciais de filosofia e ciências humanas que oferecem alternativas à ortodoxia marxista-desconstrucionista-multiculturalista dominante (por exemplo, os livros de Eric Voegelin, Leo Strauss, Xavier Zubiri, Bernard Lonergan, Eugen Rosenstock-Huessy, Thomas Molnar, David Stove, Roger Scruton).</li>
            <li>Análises críticas dessa ortodoxia (Hilton Kramer, Roger Kimball, Keith Windschuttle, John M. Ellis, Mary Lefkowitz, Judith Reisman).</li>
            <li>Pesquisas históricas sobre o movimento esquerdista internacional, baseadas nos documentos dos Arquivos de Moscou e outras fontes recém-abertas, (John Lewis Gaddis, John Earl Haynes, Stephen Koch, Harvey Klehr, R. J. Rummel, Christopher Andrew, Herb Romerstein, Ronald Radosh, Arthur Herman).</li>
            <li>Livros sobre o esquerdismo hoje em dia, com a descrição dos laços abrangentes que unem ao terrorismo e ao narcotráfico a esquerda chique da grande mídia, das fundações bilionárias e dos organismos dirigentes internacionais ( Unholy Alliance , de David Horowitz, Countdowmn to Terror , de Curt Weldon, Treachery , de Bill Gertz, Through the Eyes of the Enemy , de Stanislav Lunev).</li>
            <li>Livros sobre a perseguição anti-religiosa no mundo e o fenômeno concomitante da expansão acelerada do cristianismo na Ásia e na África ( The Criminalization of Christianity , de Janet L. Folger, Persecution , de David Limbaugh, Megashift , de James Rutz, Jesus in Beijing , de David Aikman etc. etc.).</li>
            <li>Livros sobre questões políticas em discussão aberta nos EUA, com repercussões mundiais mais que previsíveis (Men in Black , de Mark R. Levin, So Help Me God , de Roy Moore, Deliver Us From Evil , de Sean Hannity, Liberalism Is a Mental Disorder , de Michael Savage e, evidentemente, todos os livros de Ann Coulter).</li>
            <li>Obras essenciais que deram novo impulso ao pensamento político conservador americano e europeu desde os anos 40, como as de Ludwig von Mises, Marcel de Corte, Willmore Kendall, Russel Kirk, Erik von Kuenhelt-Leddin, William F. Buckley Jr., M. Stanton Evans, Irving Babbit, Paul Elmer More e muitos outros. Neste ponto a ignorância dos nossos professores universitários chega a ser criminosa, como se viu na fraude coletiva do “Dicionário Crítico do Pensamento da Direita” (detalhes em www.olavodecarvalho.org/textos/naosabendo.htm).</li>
        </ol>
    </div>
    <div><strong>Ver Mais</strong><div>
    <div><a href="http://www.olavodecarvalho.org/semana/050815dc.htm">http://www.olavodecarvalho.org/semana/050815dc.htm</a></div>
    </div>
</div>
<h1>25 Elementos da filosofia do Olavo de Carvalho</h1> <div><a href="./pages/olavo/25olavo.html"><strong>Ver</strong><a/><div>
<h1>Resumo Teoria Política do Olavo de Carvalho</h1> <div><a href="./pages/olavo/teoria.politica.html"><strong>Ver</strong><a/><div>
<h1>Melhores posts do Olavo de Carvalho</h1> <div><a href="./pages/olavo/facebook.html"><strong>Ver</strong><a/><div>
<h5>Bons posts em geral</h5> <div><a href="./pages/facebook/goodposts.html"><strong>Ver</strong><a/><div>
<h1>Livros</h1>
"@

$indexTitle = "Central HyperText do Olavo de Carvalho"
$indexImg = "https://i.ytimg.com/vi/L4ClaPcp1k8/maxresdefault.jpg"
$descricaoHeader = "Sem a menor dificuldade [listo aqui] mais de quinhentos livros importantes, que suscitaram discussões intensas e estudos sérios nos EUA e na Europa, e que permanecem totalmente desconhecidos do nosso público, pelo simples fato de que sua leitura arriscaria furar o balão da autolatria esquerdista e varrer para o lixo do esquecimento inumeráveis prestígios acadêmicos e literários consagrados neste país ao longo das últimas décadas."
GetPageHeader $indexTitle $indexImg $descricaoHeader "livros.html" | Out-File "$dest/livros.html"
$indexHeader | Out-File "$dest/livros.html" -Append

function WriteGoodReads($row)
{
    if([string]::IsNullOrEmpty($row.isbn) -eq $false)
    {
@"
<div>
    <div id="gr_add_to_books">
        <div class="gr_custom_each_container_">
            <a target="_blank" style="border:none" rel="nofollow noopener noreferrer" href="https://www.goodreads.com/book/isbn/$($row.isbn)"><img src="https://www.goodreads.com/images/atmb_add_book-70x25.png" /></a>
        </div>
    </div>                    
</div>
"@
    }
}

function Remove-StringDiacritic
{
    param
    (
        [ValidateNotNullOrEmpty()]
        [Alias('Text')]
        [System.String]$String,
        [System.Text.NormalizationForm]$NormalizationForm = "FormD"
    )
    
    BEGIN
    {
        $Normalized = $String.Normalize($NormalizationForm)
        $NewString = New-Object -TypeName System.Text.StringBuilder
        
    }
    PROCESS
    {
        $normalized.ToCharArray() | ForEach-Object -Process {
            if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($psitem) -ne [Globalization.UnicodeCategory]::NonSpacingMark)
            {
                [void]$NewString.Append($psitem)
            }
        }
    }
    END
    {
        Write-Output $($NewString -as [string])
    }
}

function GetAncherName($name)
{
    #(Remove-StringDiacritic $name).Replace(" ","").Replace(":","").Replace("–","").ToLower()
    $name
}

function WriteBook($book, $imgPrefix = ".", $suggestionHardLink = $false)
{
    $_ = $book
    $title = "<div><strong><a id=""$(GetAncherName $_.Livro)"" class=""title"">$($_.Livro)</a></strong></div>"
    $row = $books|? name -eq $_.Livro
    if($row -ne $null) {
        if( (Test-Path "$dest/pages/$($row.isbn)/index.html") -eq $true) {
            $title = "<div><strong><a id=""$(GetAncherName $_.Livro)"" href=""$imgPrefix/pages/$($row.isbn)/index.html"">$($_.Livro)</a></strong></div>"
        }
    }
@"
    <div style="padding: 10px" class="book">
        <div>
            $(GetImage $_.Livro 100 $imgPrefix)
            <div style="display:inline-block;vertical-align:top">
                $title
                <div><span>$($_.Autor)</span></div>
                $(WriteGoodReads $row)                
            </div>
        </div>        
        $(
        if([string]::IsNullOrWhiteSpace($_.DATE) -eq $false){
@"
            <div style="padding:20px">
                <div><strong>Olavo de Carvalho</strong></div>
                <div style="padding-left:20px">
                    <div>$($_.Descricao)</div>
                </div>
                <div style="padding-left:20px">
                    <a href="$(getMP3File $_.DATE)">$(getMP3File $_.DATE)</a>
                </div>
                <div style="padding-left:20px">
                    <button class="pure-button" onclick="embedmp3(this, '$(getMP3File $_.DATE)', $($_.StartAt))">
                        Ouvir 
                    </button>
                    <a href="$imgPrefix/livrosdb/episodes/$($_.DATE).html" target="_blank">Mais sobre este episódio</a>
                    <div class="audioholder">
                    </div>
                </div>
            </div>
"@
        }
        )
        $(GetLinks $_.Livro)
        $(GetSuggestions $_.Livro $imgPrefix $suggestionHardLink)
    </div>
"@
}

$rowsCount = ($rows | Measure-Object).Count
$i = 0
$rows|% { 
    Write-Progress -Activity "." -CurrentOperation "." -PercentComplete ([float]$i/[float]$rowsCount*100.0)
    WriteBook($_) 
    $i = $i + 1
} | Out-File "$dest/livros.html" -Append
$rows2|% { WriteBook($_) } | Out-File "$dest/livros.html" -Append

@"
<script>
    if(window.URLSearchParams) {
        var urlParams = new URLSearchParams(window.location.search);
        var book = urlParams.get('book');
        ScrollTo(book);
    }

    var idx = lunr(function () {
        this.ref('id')
        this.field('title')
        document.querySelectorAll(".book").forEach(function (book) {
            var title = book.querySelector(".title");
            if(title) {
                var id = title.id;
                var obj = {
                    id,
                    title: title.innerText.toLowerCase()
                }                
                this.add(obj);
            }
        }, this);
    });
    
    document.getElementById("searchInput")
        .addEventListener("input", function(e) {
            var result = idx.search(e.target.value);
            if(result[0]) ScrollTo(result[0].ref);
        });    
</script>
</body>
<html>
"@ | Out-File "$dest/livros.html" -Append
$html = cat "$dest/livros.html" -Raw
[System.IO.File]::WriteAllText("$dest/livros.html",$html)

function BookDetailPage($_)
{
    Write-Progress -Activity "." -CurrentOperation "." -PercentComplete ([float]$i/[float]$rowsCount*100.0)
    $i = $i + 1

    $row = $books|? name -eq $_.Livro
    if($row -ne $null) {
        $imgPrefix = "../.."
        $html = "<div><a href=`"../../livros.html`">Ver mais livros</a></div>" + (WriteBook $_ $imgPrefix $true)
        mkdir "$dest/pages/$($row.ISBN)" -Force -EA SilentlyContinue

        $fileOut = "$dest/pages/$($row.ISBN)/index.html"
        GetPageHeader $row.name "https://xunilrj.github.io/covers/$($row.isbn).jpg" $_.Descricao "pages/$($row.ISBN)/index.html" | Out-File $fileOut
        $html | Out-File $fileOut -Append

        $html = cat $fileOut -Raw
        [System.IO.File]::WriteAllText($fileOut,$html)
    }
}

$i = 0;
$rows|% { BookDetailPage $_ }
$rows2|% { BookDetailPage $_ }
start "$dest/livros.html"