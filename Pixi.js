
//Called when application is started.
function OnStart()
{
  var xmlSheet = readTextFile("Img/cityTiles_sheet.xml");
  var jsonSheet = xmlToJsonAtlas(xmlSheet);
  console.log(JSON.stringify(jsonSheet));
  app.WriteFile( "Img/cityTiles_sheet.json", JSON.stringify(jsonSheet)  );
  
	//Create a layout with objects vertically centered.
	lay = app.CreateLayout( "linear", "VCenter,FillXY" );	

	m_web = app.CreateWebView( 1, 0.9 );
	LoadHtmlWrapper();
	lay.AddChild( m_web );
	
	//Add layout to app.	
	app.AddLayout( lay );
}

function LoadHtmlWrapper()
{
	var html = "<html><head>";
	html += "<meta name='viewport' content='width=device-width'>";
	html += "</head><body>";
	html += "<script src='Pixi.js'></script>";
	html += "<script>document.addEventListener('DOMContentLoaded', OnReady)</script>";
	html += "<script src='pixi.min.js'></script>";
  html += "<script src='stats.min.js'></script>";
	html += "</body></html>";
	m_web.LoadHtml( html );
}

function OnReady()
{
  m_stats = new Stats();
  
  m_app = new PIXI.Application(window.innerWidth, window.innerHeight)

	amount = (m_app.renderer instanceof PIXI.WebGLRenderer) ? 100 : 5;

	if(amount == 5)
	{
		m_app.renderer.context.mozImageSmoothingEnabled = false
		m_app.renderer.context.webkitImageSmoothingEnabled = false;
	}
	
	m_app.renderer.view.style["transform"] = "translatez(0)";
	document.body.appendChild(m_app.view);
	m_app.renderer.view.style.position = "absolute";
	
	m_counter = document.createElement("div");
	m_counter.className = "counter";
	m_counter.innerHTML = 0;
	m_counter.style.position = "absolute";
	m_counter.style.color = "#0ff";
	m_counter.style.fontSize = "16px";
	document.body.appendChild(m_counter);
	
	document.body.appendChild(m_stats.domElement);
	
	PIXI.loader
	  .add("Img/cityTiles_sheet.json")
	  .on("progress", LoaderProgressHandler)
	  .load(LoaderSetup);
	
	Resize();
	
	m_app.ticker.add(Update);
}

function LoaderProgressHandler(loader, resource)
{
  console.log(resource.url);
  console.log(loader.progress);
}

function LoaderSetup()
{
  console.log("image loaded, testingScene" );
  
  var tileTextureCache = PIXI.utils.TextureCache["cityTiles_000.png"];
  tileTextureCache.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  
  var sprite = new PIXI.Sprite(
    tileTextureCache
  );
  
  m_app.stage.addChild(sprite);
}

function Resize()
{
  width = window.innerWidth;
  height = window.innerHeight;
  
  m_app.renderer.view.style.left = 0;
  m_app.renderer.view.style.top = 0;
  m_app.renderer.resize(width, height);
  
  m_counter.style.left = 100 + "px";
	m_counter.style.top = 0 + "px";
}

var m_frameCounter = 0;

function UpdateStage()
{
  //console.log(m_frameCounter);
  
  var randomId = m_frameCounter % 128;
  var textureName = "cityTiles_" + ("00" + randomId).slice(-3) + ".png";
  
  var tileTextureCache = PIXI.utils.TextureCache[textureName];
  
  var sprite = new PIXI.Sprite(tileTextureCache);
  sprite.x = (m_frameCounter * 3) % 128;
  sprite.y = (m_frameCounter * 7) % 128;
  
  m_app.stage.addChild(sprite);
}

function Update()
{
  m_stats.begin();
  UpdateStage();
  m_stats.end();
  m_frameCounter++;
}

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    var allText = "";
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return allText;
}

function xmlToJsonAtlas(xmlString)
{
  console.log("loading atlas");
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(xmlString,"text/xml");
  var masterXml = xmlDoc.getElementsByTagName("TextureAtlas")[0];
  var filePath = masterXml.attributes["imagePath"].value;
  var collection = masterXml.childNodes;
  var textureCount = 0;
  
  var framesJson = {};
  
  for (i = 0; i < collection.length; i++)
  {
    var spriteNode = collection.item(i);
    if (spriteNode.nodeName != "SubTexture")
      continue;
    var path = spriteNode.attributes["name"].value;
    var x = parseInt(spriteNode.attributes["x"].value);
    var y = parseInt(spriteNode.attributes["y"].value);
    var w = parseInt(spriteNode.attributes["width"].value);
    var h = parseInt(spriteNode.attributes["height"].value);
    
    var localJsonContent = {
      frame : { x : x, y : y, w : w, h : h },
      spriteSourceSize : { x : 0, y : 0, w: w, h : h },
      sourceSize : { w : w, h : h },
      rotated : false,
      trimmed : false,
      pivot : { x : 0.5, y : 0.5 }
     };
     
     framesJson[path] = localJsonContent;
    
    textureCount++;
  }
  
  var metaJson = { image : filePath };
  
  var atlasJson = { frames : framesJson, meta : metaJson };
  return atlasJson;
}