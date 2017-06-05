
//Called when application is started.
function OnStart()
{
    var xmlSheet = MUTILS.readTextFile( "Img/cityTiles_sheet.xml" );
    var jsonSheet = MUTILS.xmlToJsonAtlas( xmlSheet );
    //console.log( JSON.stringify( jsonSheet ));
    app.WriteFile( "Img/cityTiles_sheet.json", JSON.stringify( jsonSheet ));
  
  	//Create a layout with objects vertically centered.
  	var lay = app.CreateLayout( "linear", "VCenter,FillXY" );	

	  var web = app.CreateWebView( 1, 0.9 );
  	loadHtmlWrapper(web);
  	lay.AddChild( web );
	  app.AddLayout( lay );
}

function loadHtmlWrapper( webview )
{
  	var html = "<html><head>";
  	html += "<meta name='viewport' content='width=device-width'>";
  	html += "</head><body>";
  	html += "<script src='Pixi.js'></script>";
  	html += "<script>document.addEventListener('DOMContentLoaded', OnReady)</script>";
  	html += "<script src='pixi.min.js'></script>";
    html += "<script src='stats.min.js'></script>";
  	html += "</body></html>";
  	webview.LoadHtml( html );
}

function OnReady()
{
  m_stats = new Stats();
  
  m_app = new PIXI.Application(window.innerWidth, window.innerHeight);
  
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

	var amount = (m_app.renderer instanceof PIXI.WebGLRenderer) ? 100 : 5;

	if(amount == 5)
	{
		m_app.renderer.context.mozImageSmoothingEnabled = false
		m_app.renderer.context.webkitImageSmoothingEnabled = false;
	}
	
	m_app.renderer.view.style["transform"] = "translatez(0)";
	document.body.appendChild(m_app.view);
	m_app.renderer.view.style.position = "absolute";
	
	m_interactionManager = m_app.renderer.plugins.interaction;
	console.log("touch " + m_interactionManager.supportsTouchEvents);
	
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
	
	m_state = WaitingState;
	
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
  
  m_state = MapRenderState;
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

function GetTextureName(id)
{
  return  "cityTiles_" + ("00" + id).slice(-3) + ".png";
}

var c_textureBaseSizeX = 130;
var c_textureBaseSizeY = 66;

function GetTileDisplayX(x, y)
{
  return c_textureBaseSizeX / 2 * x - c_textureBaseSizeX / 2 * y;
}

function GetTileDisplayY(x, y)
{
  return c_textureBaseSizeY / 2 * x + c_textureBaseSizeY / 2 * y;
}

function WaitingState()
{
  // do nothing, wait for loader
}

var m_frameCounter = 0;

function TestRenderState()
{
  //console.log(m_frameCounter);
  
  var randomId = m_frameCounter % 128;
  var textureName = GetTextureName(randomId);
  
  var tileTextureCache = PIXI.utils.TextureCache[textureName];
  
  var sprite = new PIXI.Sprite(tileTextureCache);
  sprite.x = Math.floor(Math.random() * m_app.renderer.width);
  sprite.y = Math.floor(Math.random() * m_app.renderer.height);
  
  m_app.stage.addChild(sprite);
}

function MapRenderState()
{
  var textureTableId = [];
  for (i = 0; i < 128; i++)
  {
    textureTableId[i] = i;
  }
  var textureTableX = 12;
  var textureTableY = 10;
  
  if (typeof m_mapDisplay === 'undefined' || m_mapDisplay === null)
  {
    m_mapDisplay = new PIXI.Container();
    
    m_mapDisplay.interactive = true;
    
    m_mapDisplay.on('pointerdown', onMapDisplayDragStart);
    m_mapDisplay.on('pointermove', onMapDisplayDragMove);
    m_mapDisplay.on('pointerupoutside', onMapDisplayDragEnd);
    m_mapDisplay.on('pointerup', onMapDisplayDragEnd);
    
    for (x = 0; x < textureTableX; x++)
    {
      for (y = 0; y < textureTableY; y++)
      {
        var i = x * textureTableY + y;
        var id = textureTableId[i];
        var textureName = GetTextureName(id);
        
        var tileTextureCache = PIXI.utils.TextureCache[textureName];
  
        var sprite = new PIXI.Sprite(tileTextureCache);
        
        //sprite.x = Math.floor(Math.random() * m_app.renderer.width);
        //sprite.y = Math.floor(Math.random() * m_app.renderer.height);
        
        sprite.x = GetTileDisplayX(x, y);
        sprite.y = GetTileDisplayY(x, y) - sprite.height;
        
        m_mapDisplay.addChild(sprite);
      }
    }
    
    m_app.stage.addChild(m_mapDisplay);
    
    /*
    console.log(m_mapDisplay.width);
    console.log(m_app.stage.width);
    console.log(m_app.renderer.width);
    console.log(m_mapDisplay.height);
    console.log(m_app.stage.height);
    console.log(m_app.renderer.height);
    */
  }
}

function MapDisplayDragCheck(_this)
{
  if (typeof _this.touchData === 'undefined' || _this.touchData === null)
  {
    _this.touchData = [];
  }
}

function Distance(pos1, pos2)
{
  return Math.sqrt((pos2.x - pos1.x)**2 + (pos2.y - pos1.y)**2);
}

function MapDisplayDragRefresh(_this)
{
  MapDisplayDragCheck(_this);
  if (_this.touchData.length == 0)
  {
    _this.startX = null;
    _this.startY = null;
    _this.pointerStartX = null;
    _this.pointerStartY = null;
    _this.dragging = false;
  }
  if (_this.touchData.length > 0)
  {
    var newPosition = _this.touchData[0].getLocalPosition(_this.parent);
    _this.startX = _this.x;
    _this.startY = _this.y;
    _this.pointerStartX = newPosition.x;
    _this.pointerStartY = newPosition.y;
    _this.startScale = _this.scale;
    _this.startDistance = 0;
    _this.dragging = true;
  }
  if (_this.touchData.length > 1)
  {
    var pos1 = _this.touchData[0].getLocalPosition(_this.parent);
    var pos2 = _this.touchData[1].getLocalPosition(_this.parent);
    _this.startDistance = Distance(pos1, pos2);
  }
}

function onMapDisplayDragStart(event)
{
  MapDisplayDragCheck(this);
  this.touchData.push(event.data);
  console.log("added " + event.data.identifier);
  MapDisplayDragRefresh(this);
  
  /*
    if (typeof this.firstTouchData === 'undefined' || this.firstTouchData === null)
    {
      this.firstTouchData = event.data;
      this.dragging = true;
      this.alpha = 0.5;
      var newPosition = this.firstTouchData.getLocalPosition(this.parent);
      this.startX = this.x;
      this.startY = this.y;
      this.pointerStartX = newPosition.x;
      this.pointerStartY = newPosition.y;
    }
    else if (typeof secondTouchData === 'undefined' || this.secondTouchData === null)
    {
      this.secondTouchData = event.data;
      this.zooming = true;
    }
    */
}

function onMapDisplayDragEnd(event)
{
  MapDisplayDragCheck(this);
  var touchIndex = this.touchData.indexOf(event.data);
  if (touchIndex >= 0)
  {
    this.touchData.splice(touchIndex, 1);
  }
  console.log("removed " + event.data.identifier);
  MapDisplayDragRefresh(this);
}

function onMapDisplayDragMove()
{
  if (this.dragging)
  {
    var newPosition = this.touchData[0].getLocalPosition(this.parent);
    this.x = this.startX - this.pointerStartX + newPosition.x;
    this.y = this.startY - this.pointerStartY + newPosition.y;
  }
}

function Update()
{
  m_stats.begin();
  m_state();
  m_stats.end();
  m_frameCounter++;
}

var MUTILS = (function ()
{
    var public = {};
    public.readTextFile = function ( file )
    {
        var rawFile = new XMLHttpRequest();
        var allText = "";
        rawFile.open( "GET", file, false );
        rawFile.onreadystatechange = function ()
        {
            if ( rawFile.readyState === 4 )
            {
                if ( rawFile.status === 200 || rawFile.status == 0 )
                {
                    allText = rawFile.responseText;
                }
            }
        }
        rawFile.send( null );
        return allText;
    }

    public.xmlToJsonAtlas = function ( xmlString )
    {
        console.log( "loading atlas" );
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString( xmlString,"text/xml" );
        var masterXml = xmlDoc.getElementsByTagName( "TextureAtlas" )[0];
        var filePath = masterXml.attributes["imagePath"].value;
        var collection = masterXml.childNodes;
        var textureCount = 0;
  
        var framesJson = {};
  
        for ( var i = 0; i < collection.length; i++ )
        {
            var spriteNode = collection.item( i );
            if (spriteNode.nodeName != "SubTexture")
            {
                continue;
            }
            var path = spriteNode.attributes["name"].value;
            var x = parseInt( spriteNode.attributes["x"].value );
            var y = parseInt( spriteNode.attributes["y"].value );
            var w = parseInt( spriteNode.attributes["width"].value );
            var h = parseInt( spriteNode.attributes["height"].value );
    
            var localJsonContent =
            {
                frame : { x : x, y : y, w : w, h : h },
                spriteSourceSize : { x : 0, y : 0, w: w, h : h },
                sourceSize : { w : w, h : h },
                rotated : false,
                trimmed : false,
                pivot : { x : 0, y : 0 }
            };
    
            framesJson[path] = localJsonContent;
    
            textureCount++;
        }
  
        var metaJson = { image : filePath };
  
        var atlasJson = { frames : framesJson, meta : metaJson };
  
        return atlasJson;
    }
    
    return public;
})();