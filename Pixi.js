
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
  g_stats = new Stats();
  
  g_app = new PIXI.Application(window.innerWidth, window.innerHeight);
  
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

	var amount = (g_app.renderer instanceof PIXI.WebGLRenderer) ? 100 : 5;

	if ( amount == 5 )
	{
		g_app.renderer.context.mozImageSmoothingEnabled = false
		g_app.renderer.context.webkitImageSmoothingEnabled = false;
	}
	
	g_app.renderer.view.style["transform"] = "translatez(0)";
	document.body.appendChild(g_app.view);
	g_app.renderer.view.style.position = "absolute";
	
	g_interactionManager = g_app.renderer.plugins.interaction;
	console.log("touch " + g_interactionManager.supportsTouchEvents);
	
	g_counter = document.createElement("div");
	g_counter.className = "counter";
	g_counter.innerHTML = 0;
	g_counter.style.position = "absolute";
	g_counter.style.color = "#0ff";
	g_counter.style.fontSize = "16px";
	document.body.appendChild(g_counter);
	
	document.body.appendChild(g_stats.domElement);
	
	PIXI.loader
	  .add("Img/cityTiles_sheet.json")
	  .on("progress", LoaderProgressHandler)
	  .load(LoaderSetup);
	
	Resize();
	
	g_state = WaitingState;
	
	g_app.ticker.add(Update);
}

function LoaderProgressHandler(loader, resource)
{
  console.log(resource.url);
  console.log(loader.progress);
}

function LoaderSetup()
{
  console.log("image loaded, testingScene" );
  
  g_state = MMAPRENDER.MapRenderState;
}

function Resize()
{
  var width = window.innerWidth;
  var height = window.innerHeight;
  
  g_app.renderer.view.style.left = 0;
  g_app.renderer.view.style.top = 0;
  g_app.renderer.resize(width, height);
  
  g_counter.style.left = 100 + "px";
	g_counter.style.top = 0 + "px";
}

function GetTextureName(id)
{
  return  "cityTiles_" + ("00" + id).slice(-3) + ".png";
}





function WaitingState()
{
  // do nothing, wait for loader
}

var g_frameCounter = 0;

function TestRenderState()
{
  //console.log(g_frameCounter);
  
  var randomId = g_frameCounter % 128;
  var textureName = GetTextureName(randomId);
  
  var tileTextureCache = PIXI.utils.TextureCache[textureName];
  
  var sprite = new PIXI.Sprite(tileTextureCache);
  sprite.x = Math.floor(Math.random() * g_app.renderer.width);
  sprite.y = Math.floor(Math.random() * g_app.renderer.height);
  
  g_app.stage.addChild(sprite);
}

var MMAPRENDER = (function ()
{
    var public = {};
    
    var m_mapDisplay = null;
    
    var TEXTURE_BASE_SIZE_X = 130;
    var TEXTURE_BASE_SIZE_Y = 66;
    
public.MapRenderState = function()
{
  var textureTableId = [];
  for (i = 0; i < 128; i++)
  {
    textureTableId[i] = i;
  }
  var textureTableX = 10;
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
        
        //sprite.x = Math.floor(Math.random() * g_app.renderer.width);
        //sprite.y = Math.floor(Math.random() * g_app.renderer.height);
        
        sprite.x = getTileDisplayX(x, y);
        sprite.y = getTileDisplayY(x, y) - sprite.height;
        
        m_mapDisplay.addChild(sprite);
      }
    }
    
    g_app.stage.addChild(m_mapDisplay);
    
    /*
    console.log(m_mapDisplay.width);
    console.log(g_app.stage.width);
    console.log(g_app.renderer.width);
    console.log(m_mapDisplay.height);
    console.log(g_app.stage.height);
    console.log(g_app.renderer.height);
    */
  }
}

var getTileDisplayX = function (x, y)
{
  return TEXTURE_BASE_SIZE_X / 2 * x - TEXTURE_BASE_SIZE_X / 2 * y;
}

var getTileDisplayY = function (x, y)
{
  return TEXTURE_BASE_SIZE_Y / 2 * x + TEXTURE_BASE_SIZE_Y / 2 * y;
}

var mapDisplayDragCheck = function ( _this )
{
  if (typeof _this.touchData === 'undefined' || _this.touchData === null)
  {
    _this.touchData = [];
  }
}

var getDistanceBetween = function ( pos1, pos2 )
{
  return Math.sqrt((pos2.x - pos1.x)**2 + (pos2.y - pos1.y)**2);
}

var mapDisplayDragRefresh = function ( _this )
{
  mapDisplayDragCheck( _this );
  if ( _this.touchData.length == 0 )
  {
    _this.startX = null;
    _this.startY = null;
    _this.pointerStartX = null;
    _this.pointerStartY = null;
    _this.dragging = false;
  }
  if ( _this.touchData.length > 0 )
  {
    var pointerPositionOnScreen = _this.touchData[0].getLocalPosition( _this.parent );
    _this.startPointerScreenX = pointerPositionOnScreen.x;
    _this.startPointerScreenY = pointerPositionOnScreen.y;
    _this.startPivotSpriteX = _this.pivot.x;
    _this.startPivotSpriteY = _this.pivot.y;
    _this.startSpriteScreenX = _this.x;
    _this.startSpriteScreenY = _this.y;
    
    // pivot is put on the touched location of sprite
    _this.pivot.x = _this.startPointerScreenX - _this.startSpriteScreenX + _this.startPivotSpriteX;
    _this.pivot.y = _this.startPointerScreenY - _this.startSpriteScreenY + _this.startPivotSpriteY;
    
    //_this.x = _this.startSpriteScreenX + _this.pivot.x - _this.startPivotSpriteX;
    //_this.y = _this.startSpriteScreenY + _this.pivot.y - _this.startPivotSpriteY;
    _this.x = _this.startPointerScreenX;
    _this.y = _this.startPointerScreenY;
    
    _this.dragging = true;
    
    //console.log(_this.startPointerScreenX);
    //console.log(_this.startPointerScreenY);
    //console.log(_this.startPivotSpriteX);
    //console.log(_this.startPivotSpriteY);
    //console.log(_this.startSpriteScreenX);
    //console.log(_this.startSpriteScreenY);
  }
  if ( _this.touchData.length > 1 )
  {
    var pos1 = _this.touchData[0].getLocalPosition( _this.parent );
    var pos2 = _this.touchData[1].getLocalPosition( _this.parent );
    _this.startDistance = getDistanceBetween(pos1, pos2);
  }
}

var onMapDisplayDragStart = function ( event )
{
  mapDisplayDragCheck( this );
  this.touchData.push( event.data );
  console.log( "added " + event.data.identifier );
  mapDisplayDragRefresh( this );
}

var onMapDisplayDragEnd = function ( event )
{
  mapDisplayDragCheck( this );
  var touchIndex = this.touchData.indexOf( event.data );
  if ( touchIndex >= 0 )
  {
    this.touchData.splice( touchIndex, 1 );
  }
  console.log( "removed " + event.data.identifier );
  mapDisplayDragRefresh( this );
}

var onMapDisplayDragMove = function()
{
    if ( this.dragging )
    {
        //console.log('move');
        var newPosition = this.touchData[0].getLocalPosition( this.parent );
        // upon dragging, pivot does not move
        this.x = newPosition.x - this.startPointerScreenX + this.startPointerScreenX;
        this.y = newPosition.y - this.startPointerScreenY + this.startPointerScreenY;
    }
}
    
    return public;
})();

function Update()
{
  g_stats.begin();
  g_state();
  g_stats.end();
  g_frameCounter++;
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