
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
    
    g_updateTimestamp = Date.now();
  
    g_app = new PIXI.Application(window.innerWidth, window.innerHeight);
  
    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

	var amount = (g_app.renderer instanceof PIXI.WebGLRenderer) ? 100 : 5;

	if ( amount == 5 )
	{
		//g_app.renderer.context.mozImageSmoothingEnabled = false
		//g_app.renderer.context.webkitImageSmoothingEnabled = false;
	}
	
	g_app.renderer.view.style["transform"] = "translatez(0)";
	document.body.appendChild(g_app.view);
	g_app.renderer.view.style.position = "absolute";
	
	g_interactionManager = g_app.renderer.plugins.interaction;
	console.log("touch " + g_interactionManager.supportsTouchEvents);
	g_interactionManager.moveWhenInside = true;
	
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
    MMAP.initialize();
    g_state = MMAP.mapState;
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

var mathCantor = function( X, Y )
{
    return ( X + Y ) * ( X + Y + 1 ) / 2 + Y;
}
    
var mathReverseCantorPair = function( z )
{
    var pair = [];
    var t = Math.floor( ( -1 + Math.sqrt( 1 + 8 * z ) ) / 2 );
    var x = t * (t + 3) / 2 - z;
    var y = z - t * (t + 1) / 2;
    pair[0] = x;
    pair[1] = y;
    return pair;
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

var MMAP = (function ()
{
    var public = {};
    
    public.initialize = function()
    {
        MMAPDATA.initialize();
        MMAPRENDER.initialize();
        MMAPUI.initialize();
    }
    
    public.mapState = function()
    {
        // every frame
        var changedTile = MMAPDATA.commitChangeLog();
        MMAPRENDER.draw( changedTile );
        MMAPDATA.randomizeTile( 1 );
    }
    
    return public;
})();

var MMAPDATA = (function ()
{
    var public = {};
    
    var m_mapTableData = [];
    var m_mapChangeLog = [];
    var m_mapTableSizeX = 0;
    var m_mapTableSizeY = 0;
    
    public.GetMapTableData = function()
    {
        return m_mapTableData;
    }
    public.GetMapTableSizeX = function()
    {
        return m_mapTableSizeX;
    }
    public.GetMapTableSizeY = function()
    {
        return m_mapTableSizeY;
    }
    public.initialize = function()
    {
        m_mapTableSizeX = 500;
        m_mapTableSizeY = 500;
        for ( var x = 0; x < m_mapTableSizeX; x++ )
        {
            for ( var y = 0; y < m_mapTableSizeY; y++ )
            {
                var randomId = Math.floor(Math.random() * 128);
                var tile = { x : x, y : y, id : randomId };
                m_mapChangeLog.push( tile );
            }
        }
    }
    public.randomizeTile = function ( count )
    {
        for ( var i = 0; i < count; i++ )
        {
            var x = Math.floor( m_mapTableSizeX * Math.random() );
            var y = Math.floor( m_mapTableSizeY * Math.random() );
            var id = Math.floor( 128 * Math.random() );
            var tile = { x : x, y : y, id : id };
            m_mapChangeLog.push( tile );
        }
    }
    public.commitChangeLog = function()
    {
        var output = [];
        for ( var i = 0; i < m_mapChangeLog.length; i++ )
        {
            var tile = m_mapChangeLog[i];
            var index = tile.x * m_mapTableSizeY + tile.y;
            m_mapTableData[ index ] = tile.id;
            output.push( tile );
        }
        m_mapChangeLog = [];
        return output;
    }
    public.tileId = function( tileX, tileY )
    {
        var index = tileX * m_mapTableSizeY + tileY;
        return m_mapTableData[ index ];
    }
    public.isValidCoordinates = function ( tileX, tileY )
    {
        var isOutOfBound = tileX < 0 || 
            tileX >= public.GetMapTableSizeX() || 
            tileY < 0 ||
            tileY >= public.GetMapTableSizeY();
        return !isOutOfBound;
    }
    
    return public;
})();

// a map batch regroups multiple tiles
// abstraction layer for pixi container and sprite
var MMAPBATCH = (function ()
{
    var public = {};
    
    var m_mapLayer;
    
    var m_mapSpriteBatch = [];
    var m_mapSprite = [];
    var m_mapSpriteId = [];
    
    var BATCH_SIZE_X = 4;
    var BATCH_SIZE_Y = 4;
    
    public.initialize = function()
    {
        m_mapLayer = new PIXI.Container();
        g_app.stage.addChild( m_mapLayer );
    }
    
    var hashBatchIndexByTile = function( tileX, tileY )
    {
        var X = Math.floor( tileX / BATCH_SIZE_X );
        var Y = Math.floor( tileY / BATCH_SIZE_Y );
        return hashBatchIndex( X, Y );
    }
    
    var hashBatchIndex = function( batchX, batchY )
    {
        return mathCantor( batchX, batchY );
    }
    
    var hashSpriteIndex = function( tileX, tileY )
    {
        var X = tileX;
        var Y = tileY;
        return mathCantor( X, Y );
    }
    
    // create one empty if none
    // excepted if coordinates are negative
    var getBatch = function( tileX, tileY )
    {
        var index = hashBatchIndexByTile( tileX, tileY );
        var batchX = Math.floor( tileX / BATCH_SIZE_X );
        var batchY = Math.floor( tileY / BATCH_SIZE_Y );
        if ( !hasBatch( batchX, batchY ) )
        {
            var batch = new PIXI.Container();
    
            batch.interactive = true;
            batch.visible = false;
    
            batch.on('pointerdown', MMAPRENDER.onMapDisplayDragStart);
            batch.on('pointermove', MMAPRENDER.onMapDisplayDragMove);
            batch.on('pointerupoutside', MMAPRENDER.onMapDisplayDragEnd);
            batch.on('pointerup', MMAPRENDER.onMapDisplayDragEnd);
            
            batch.cacheAsBitmap = true;
            
            m_mapLayer.addChild( batch );
            
            var batchCount = m_mapLayer.children.length;
            
            m_mapSpriteBatch[ index ] = batch;
            
            var cTileX = public.tileXToStartTileX( tileX );
            var cTileY = public.tileYToStartTileY( tileY );
            console.log('created container for ' + cTileX + ',' + cTileY + ',' + batchCount);
        }
        return m_mapSpriteBatch[ index ];
    }
    
    var hasBatch = function( batchX, batchY )
    {
        var i = hashBatchIndex( batchX, batchY );
        return !( typeof m_mapSpriteBatch[ i ] === 'undefined' || m_mapSpriteBatch[ i ] === null );
    }
    
    var hasSprite = function( tileX, tileY )
    {
        var i = hashSpriteIndex( tileX, tileY );
        return !( typeof m_mapSprite[ i ] === 'undefined' || m_mapSprite[ i ] === null );
    }
    
    public.setSprite = function( tileX, tileY, id, x, y )
    {
        var index = hashSpriteIndex( tileX, tileY );
        if ( !hasSprite( tileX, tileY ) )
        {
            var textureName = GetTextureName( id );
            var tileTextureCache = PIXI.utils.TextureCache[ textureName ];
            var sprite = new PIXI.Sprite( tileTextureCache );
            
            sprite.x = x - sprite.width / 2;
            sprite.y = y - sprite.height;
            sprite.visible = true;
            
            m_mapSprite[ index ] = sprite;
            m_mapSpriteId[ index ] = id;
            
            getBatch( tileX, tileY ).addChild( sprite );
            
            //console.log('added ' + sp + ' ' + tileX + ' ' + tileY ); sp++;
        }
        // it is likely this
        else if ( m_mapSpriteId[ index ] != id )
        {
            var batch = getBatch( tileX, tileY );
            batch.cacheAsBitmap = false;
            
            var textureName = GetTextureName( id );
            var tileTextureCache = PIXI.utils.TextureCache[ textureName ];
            var sprite = m_mapSprite[ index ];
            sprite.setTexture( tileTextureCache );
            sprite.x = x - sprite.width / 2;
            sprite.y = y - sprite.height;
            m_mapSpriteId[ index ] = id;
            
            batch.cacheAsBitmap = true;
        }
    }
    
    public.tileXToStartTileX = function( tileX )
    {
        return public.tileXToBatchX( tileX ) * BATCH_SIZE_X;
    }
    
    public.tileYToStartTileY = function( tileY )
    {
        return public.tileYToBatchY( tileY ) * BATCH_SIZE_Y;
    }
    
    // end tile excluded
    public.tileXToEndTileX = function( tileX )
    {
        return public.tileXToStartTileX( tileX ) + BATCH_SIZE_X;
    }
    
    public.tileXToEndTileY = function( tileY )
    {
        return public.tileYToStartTileY( tileY ) + BATCH_SIZE_Y;
    }
    
    public.tileXToBatchX = function( tileX )
    {
        return Math.floor( Math.floor( tileX ) / BATCH_SIZE_X );
    }
    
    public.tileYToBatchY = function( tileY )
    {
        return Math.floor( Math.floor( tileY ) / BATCH_SIZE_Y );
    }
    
    public.batchXToStartTileX = function( batchX )
    {
        return batchX * BATCH_SIZE_X;
    }
    
    public.batchYToStartTileY = function( batchY )
    {
        return batchY * BATCH_SIZE_Y;
    }
    
    public.batchXToEndTileX = function( batchX )
    {
        return ( batchX + 1 ) * BATCH_SIZE_X;
    }
    
    public.batchYToEndTileY = function( batchY )
    {
        return ( batchY + 1 ) * BATCH_SIZE_Y;
    }
    
    public.setBatchVisible = function( batchX, batchY, flag )
    {
        var tileX = public.batchXToStartTileX( batchX );
        var tileY = public.batchYToStartTileY( batchY );
        getBatch( tileX, tileY ).visible = flag;
    }
    
    public.setBatchPosition = function( batchX, batchY, x, y )
    {
        var tileX = public.batchXToStartTileX( batchX );
        var tileY = public.batchYToStartTileY( batchY );
        var batch = getBatch( tileX, tileY );
        batch.x = x;
        batch.y = y;
        batch.pivot.x = 0;
        batch.pivot.y = 0;
    }
    
    public.setBatchScale = function( batchX, batchY, scaleX, scaleY )
    {
        var tileX = public.batchXToStartTileX( batchX );
        var tileY = public.batchYToStartTileY( batchY );
        var batch = getBatch( tileX, tileY );
        batch.scale.x = scaleX;
        batch.scale.y = scaleY;
    }
    
    public.setVisibilityFlagInRadius = function( flag, centerTileX, centerTileY, radius, flagValue )
    {
        var centerBatchX = public.tileXToBatchX( centerTileX );
        var centerBatchY = public.tileYToBatchY( centerTileY );
        for ( var i = -radius; i <= radius; i++ )
        {
            for ( var j = -radius; j <= radius; j++ )
            {
                var batchX = centerBatchX + i;
                var batchY = centerBatchY + j;
                if ( batchX >= 0 && batchY >= 0)
                {
                    var index = mathCantor( batchX, batchY );
                    if ( typeof flag[ index ] === 'undefined' )
                    {
                        flag[ index ] = {};
                    }
                    flag[ index ].visible = flagValue;
                }
            }
        }
    }
    
    public.setPositionFlagInRadius = function( flag, centerTileX, centerTileY, radius, flagValue )
    {
        var centerBatchX = public.tileXToBatchX( centerTileX );
        var centerBatchY = public.tileYToBatchY( centerTileY );
        for ( var i = -radius; i <= radius; i++ )
        {
            for ( var j = -radius; j <= radius; j++ )
            {
                var batchX = centerBatchX + i;
                var batchY = centerBatchY + j;
                if ( batchX >= 0 && batchY >= 0)
                {
                    var index = mathCantor( batchX, batchY );
                    if ( typeof flag[ index ] === 'undefined' )
                    {
                        flag[ index ] = {};
                    }
                    flag[ index ].position = flagValue;
                }
            }
        }
    }
    
    public.setTextureFlagInNewBatch = function( flag  )
    {
        var keys = Object.keys( flag );
        for ( var i in keys )
        {
            var k = keys[ i ];
            var pair = mathReverseCantorPair( k );
            var batchX = pair[ 0 ];
            var batchY = pair[ 1 ];
            var exists = hasBatch( batchX, batchY );
            if ( !exists )
            {
                flag[ k ].loadTexture = true;
            }
        }
    }
    
    public.setTextureFlagInRadiusAndUpdatedTiles = function( flag, centerTileX, centerTileY, radius, updatedTiles )
    {
        var centerBatchX = public.tileXToBatchX( centerTileX );
        var centerBatchY = public.tileYToBatchY( centerTileY );
        for ( var i = 0; i < updatedTiles.length; i++)
        {
            var tileX = updatedTiles[ i ].x;
            var tileY = updatedTiles[ i ].y;
            var batchX = public.tileXToBatchX( tileX );
            var batchY = public.tileYToBatchY( tileY );
            if ( Math.abs( batchX - centerBatchX ) <= radius &&
                Math.abs( batchY - centerBatchY ) <= radius )
            {
                var index = hashBatchIndex( batchX, batchY );
                if ( typeof flag[ index ] === 'undefined' )
                {
                    flag[ index ] = {};
                }
                flag[ index ].loadTexture = true;
            }
        }
    }
    
    return public;
})();

var MMAPUI = (function ()
{
    var public = {};
    
    var m_uiLayer; 
    
    var viewWidth = function()
    {
        return g_app.renderer.width;
    }
    var viewHeight = function()
    {
        return g_app.renderer.height;
    }
    
    var addResetCameraSprite = function()
    {
        var textureName = GetTextureName( 0 );
        var tileTextureCache = PIXI.utils.TextureCache[ textureName ];
        var sprite = new PIXI.Sprite( tileTextureCache );
            
        sprite.x = viewWidth() - sprite.width / 2;
        sprite.y = 0;
        sprite.scale.x = 0.3;
        sprite.scale.y = 0.3;
        sprite.visible = true;
        sprite.interactive = true;
        
        m_uiLayer.addChild( sprite );
        
        sprite.on('pointertap', UIResetCameraAction);
    }
    
    var addZoomOutCameraSprite = function()
    {
        var textureName = GetTextureName( 2 );
        var tileTextureCache = PIXI.utils.TextureCache[ textureName ];
        var sprite = new PIXI.Sprite( tileTextureCache );
            
        sprite.x = viewWidth() - sprite.width;
        sprite.y = 40;
        sprite.scale.x = 0.3;
        sprite.scale.y = 0.3;
        sprite.visible = true;
        sprite.interactive = true;
        
        m_uiLayer.addChild( sprite );
        
        sprite.on('pointerdown', UIZoomOutCameraAction);
        sprite.on('pointerup', UIStopZoomCameraAction);
        sprite.on('pointerupoutside', UIStopZoomCameraAction);
    }
    
    var addZoomInCameraSprite = function()
    {
        var textureName = GetTextureName( 2 );
        var tileTextureCache = PIXI.utils.TextureCache[ textureName ];
        var sprite = new PIXI.Sprite( tileTextureCache );
            
        sprite.x = viewWidth() - sprite.width;
        sprite.y = 0;
        sprite.scale.x = 0.3;
        sprite.scale.y = 0.3;
        sprite.visible = true;
        sprite.interactive = true;
        
        m_uiLayer.addChild( sprite );
        
        sprite.on('pointerdown', UIZoomInCameraAction);
        sprite.on('pointerup', UIStopZoomCameraAction);
        sprite.on('pointerupoutside', UIStopZoomCameraAction);
    }
    
    var addZoomCameraSprite = function()
    {
        addZoomInCameraSprite();
        addZoomOutCameraSprite();
    }
    
    var addArrowCameraSprite = function( x, y, callbackAction )
    {
        var textureName = GetTextureName( 1 );
        var tileTextureCache = PIXI.utils.TextureCache[ textureName ];
        var sprite = new PIXI.Sprite( tileTextureCache );
        sprite.x = x;
        sprite.y = y;
        sprite.visible = true;
        sprite.interactive = true;
        sprite.scale.x = 0.3;
        sprite.scale.y = 0.3;
        m_uiLayer.addChild( sprite );
        sprite.on( 'pointerdown', callbackAction );
        sprite.on( 'pointerup', UIStopCameraAction );
        sprite.on( 'pointerupoutside', UIStopCameraAction );
    }
    
    var addArrowCamera = function()
    {
        var padMiddleX = viewWidth() - 160 / 2;
        var padMiddleY= 100;
        
        addArrowCameraSprite( padMiddleX, padMiddleY - 30, UIUpCameraAction );
        addArrowCameraSprite( padMiddleX, padMiddleY + 30, UIDownCameraAction );
        addArrowCameraSprite( padMiddleX - 30, padMiddleY, UILeftCameraAction );
        addArrowCameraSprite( padMiddleX + 30, padMiddleY, UIRightCameraAction );
    }
    
    public.initialize = function()
    {
        m_uiLayer = new PIXI.Container();
        
        addResetCameraSprite();
        addArrowCamera();
        addZoomCameraSprite();
        
        g_app.stage.addChild( m_uiLayer );
    }
    
    var UIResetCameraAction = function()
    {
        MMAPRENDER.setCameraMap( 0, 0 );
        MMAPRENDER.setCameraScale( 1, 1 );
    }
    var UIUpCameraAction = function()
    {
        MMAPRENDER.setCameraMapVelocity( 0, -10 );
    }
    var UIDownCameraAction = function()
    {
        MMAPRENDER.setCameraMapVelocity( 0, 10 );
    }
    var UILeftCameraAction = function()
    {
        MMAPRENDER.setCameraMapVelocity( -10, 0 );
    }
    var UIRightCameraAction = function()
    {
        MMAPRENDER.setCameraMapVelocity( 10, 0 );
    }
    var UIStopCameraAction = function()
    {
        MMAPRENDER.setCameraMapVelocity( 0, 0 );
    }
    var UIZoomOutCameraAction = function()
    {
        MMAPRENDER.setCameraScaleVelocity( -0.01 );
    }
    var UIZoomInCameraAction = function()
    {
        MMAPRENDER.setCameraScaleVelocity( 0.01 );
    }
    var UIStopZoomCameraAction = function()
    {
        MMAPRENDER.setCameraScaleVelocity( 0 );
    }
    
    return public;
})();

var MMAPRENDER = (function ()
{
    var public = {};
    
    var TEXTURE_BASE_SIZE_X = 130;
    var TEXTURE_BASE_SIZE_Y = 66;
    
    var viewWidth = function()
    {
        return g_app.renderer.width;
    }
    var viewHeight = function()
    {
        return g_app.renderer.height;
    }
    var cameraScreenX = function()
    {
        return viewWidth() / 2;
    }
    var cameraScreenY = function()
    {
        return viewHeight() / 2;
    }
    
    var m_cameraMapX = 0;
    var m_cameraMapY = 0;
    var m_cameraScaleX = 1;
    var m_cameraScaleY = 1;
    
    var m_cameraMapVelocityX = 0;
    var m_cameraMapVelocityY = 0;
    var m_cameraScaleVelocity = 0;
    
    var m_cameraMapXRendered = 0;
    var m_cameraMapYRendered = 0;
    var m_cameraScaleXRendered = 1;
    var m_cameraScaleYRendered = 1;
    var m_cameraCenterTileXRendered = null;
    var m_cameraCenterTileYRendered = null;
    var m_cameraBatchRadiusRendered = 1;
    
    var m_touchData = [];		
    var m_dragging = false;		
    var m_zooming = false;		
    var m_startScaleX = 1;		
    var m_startScaleY = 1;		
    var m_startDistance = 0;		
    var m_startPointerScreenX = 0;		
    var m_startPointerScreenY = 0;		
    var m_startCameraMapX = 0;		
    var m_startCameraMapY = 0;		
    
    public.initialize = function()
    {
        m_cameraMapX = 0;
        m_cameraMapY = 0;
        MMAPBATCH.initialize();
    }

    var tileToMapX = function ( tileX, tileY )
    {
        return TEXTURE_BASE_SIZE_X / 2 * ( tileX - tileY );
    }

    var tileToMapY = function ( tileX, tileY )
    {
        return TEXTURE_BASE_SIZE_Y / 2 * ( tileX + tileY );
    }
    
    // not to be used to check selection
    // does not take into account sprite height
    // nor z level
    var mapToTileX = function ( mapX, mapY )
    {
        return mapX / TEXTURE_BASE_SIZE_X + mapY / TEXTURE_BASE_SIZE_Y;
    }
    
    var mapToTileY = function ( mapX, mapY )
    {
        return mapY / TEXTURE_BASE_SIZE_Y - mapX / TEXTURE_BASE_SIZE_X;
    }
    
    var screenToMapX = function ( screenX )
    {
        return m_cameraMapX + ( screenX - cameraScreenX() ) / m_cameraScaleX;
    }
    
    var screenToMapY = function ( screenY )
    {
        return m_cameraMapY + ( screenY - cameraScreenY() ) / m_cameraScaleY;
    }
    
    var screenToTileX = function ( screenX, screenY )
    {
        var mapX = screenToMapX( screenX );
        var mapY = screenToMapY( screenY );
        return mapToTileX( mapX, mapY );
    }
    
    var screenToTileY = function ( screenX, screenY )
    {
        var mapX = screenToMapX( screenX );
        var mapY = screenToMapY( screenY );
        return mapToTileY( mapX, mapY );
    }
    
    public.setTile = function ( tileX, tileY, id )
    {
        var x = tileToMapX( tileX, tileY );
        var y = tileToMapY( tileX, tileY ); + TEXTURE_BASE_SIZE_Y;
        MMAPBATCH.setSprite( tileX, tileY, id, x, y );
    }

    var getDistanceBetween = function ( pos1, pos2 )
    {
        return Math.sqrt(Math.pow( pos2.x - pos1.x, 2 ) + Math.pow( pos2.y - pos1.y, 2 ));
    }

    var mapDisplayDragRefresh = function ( _this )
    {
        if ( m_touchData.length == 0 )
        {
            m_dragging = false;
            m_zooming = false;
            m_startScaleX = 1;
            m_startScaleY = 1;
            m_startDistance = 0;
        }
        if ( m_touchData.length > 0 )
        {
            // remember initial scale
            m_startScaleX = _this.scale.x;
            m_startScaleY = _this.scale.y;
            
            var pointerPositionOnScreen = m_touchData[0].getLocalPosition( _this.parent );
            
            m_dragging = true;
            m_zooming = false;
            m_startDistance = 0;
    
            m_startPointerScreenX = pointerPositionOnScreen.x;
            m_startPointerScreenY = pointerPositionOnScreen.y;
            m_startCameraMapX = m_cameraMapX;
            m_startCameraMapY = m_cameraMapY;
        }
        if ( m_touchData.length > 1 )
        {
            var pos1 = m_touchData[0].getLocalPosition( _this.parent );
            var pos2 = m_touchData[1].getLocalPosition( _this.parent );
            m_startDistance = getDistanceBetween( pos1, pos2 );
            m_zooming = true;
         }
    }
    
    public.onMapDisplayDragStart = function ( event )
    {
        m_touchData.push( event.data );
        mapDisplayDragRefresh( this );
        //console.log('touch ' + event.data.identifier + '/' + m_touchData.length);
    }

    public.onMapDisplayDragEnd = function ( event )
    {
        var touchIndex = m_touchData.indexOf( event.data );
        if ( touchIndex >= 0 )
        {
            m_touchData.splice( touchIndex, 1 );
        }
        mapDisplayDragRefresh( this );
        //console.log('untouch ' + event.data.identifier + '/' + m_touchData.length);
    }

    public.onMapDisplayDragMove = function()
    {
        if ( m_dragging || m_zooming )
        {
            updateCameraDrag( this );
        }
    }
    
    var updateCameraDrag = function( _this )
    {
        var pointerScreen = m_touchData[0].getLocalPosition( _this.parent );
        if ( m_zooming )
        {
            var position2 = m_touchData[1].getLocalPosition( _this.parent );
            var newDistance = getDistanceBetween( pointerScreen, position2 );
            var ratio = newDistance / m_startDistance;
            var cameraScaleX = m_startScaleX * ratio;
            var cameraScaleY = m_startScaleY * ratio;
            
            public.setCameraScale( cameraScaleX, cameraScaleY );
        }
        
        // camera moves according to differential movement of pointer
        var cameraMapX = m_startCameraMapX + ( m_startPointerScreenX - pointerScreen.x ) / m_cameraScaleX;
        var cameraMapY = m_startCameraMapY + ( m_startPointerScreenY - pointerScreen.y ) / m_cameraScaleY;
        
        public.setCameraMap( cameraMapX, cameraMapY );
    }
    
    var updateCameraVelocity = function()
    {
        var cameraMapX = m_cameraMapX + m_cameraMapVelocityX / m_cameraScaleX
        var cameraMapY = m_cameraMapY + m_cameraMapVelocityY / m_cameraScaleY
        var cameraScaleX = m_cameraScaleX + m_cameraScaleVelocity;
        var cameraScaleY = m_cameraScaleY + m_cameraScaleVelocity;
        public.setCameraScale( cameraScaleX, cameraScaleY );
        public.setCameraMap( cameraMapX, cameraMapY );
    }
    
    public.setCameraMap = function( mapX, mapY )
    {
        m_cameraMapX = mapX;
        m_cameraMapY = mapY;
        
        var tileX = centerTileX();
        var tileY = centerTileY();
        var cameraScale = Math.floor( m_cameraScaleX * 100 );
        
        g_counter.innerHTML = 'm(' + 
            Math.floor( m_cameraMapX ) + ',' + 
            Math.floor( m_cameraMapY ) + ',' + 
            cameraScale + ') t(' + 
            tileX + ',' +
            tileY + ') b(' +
            MMAPBATCH.tileXToBatchX( tileX ) + ',' +
            MMAPBATCH.tileYToBatchY( tileY ) + ')';
    }
    
    public.setCameraScale = function( scaleX, scaleY )
    {
        m_cameraScaleX = scaleX;
        if ( m_cameraScaleX < 0.2 )
        {
            m_cameraScaleX = 0.2;
        }
        m_cameraScaleY = scaleY;
        if ( m_cameraScaleY < 0.2 )
        {
            m_cameraScaleY = 0.2;
        }
    }
    
    public.setCameraMapVelocity = function( mapVelocityX, mapVelocityY )
    {
        m_cameraMapVelocityX = mapVelocityX;
        m_cameraMapVelocityY = mapVelocityY;
    }
    
    public.setCameraScaleVelocity = function( scaleVelocity )
    {
        m_cameraScaleVelocity = scaleVelocity;
    }
    
    var centerTileX = function()
    {
        return Math.floor( screenToTileX( viewWidth() / 2, viewHeight() / 2 ) );
    }
    
    var centerTileY = function()
    {
        return Math.floor( screenToTileY( viewWidth() / 2, viewHeight() / 2 ) );
    }
    
    var visibleTileRadius = function()
    {
        var topLeftCornerTileX = Math.floor( screenToTileX( 0, 0 ) );
        var topLeftCornerTileY = Math.floor( screenToTileY( 0, 0 ) );
        
        var cornerToCenterTileDistance = Math.floor( Math.sqrt( Math.pow( topLeftCornerTileX - centerTileX(), 2 ) + Math.pow( topLeftCornerTileY - centerTileY(), 2) ) );
        return cornerToCenterTileDistance;
    }
    
    var batchRadiusForScreen = function( centerBatchX, centerBatchY, screenX, screenY )
    {
        var tileX = Math.floor( screenToTileX( screenX, screenY ) );
        var tileY = Math.floor( screenToTileY( screenX, screenY ) );
        var batchX = MMAPBATCH.tileXToBatchX( tileX );
        var batchY = MMAPBATCH.tileYToBatchY( tileY );
        //console.log('rad ' + batchX + ' ' + batchY );
        var deltaBatchX = centerBatchX - batchX;
        var deltaBatchY = centerBatchY - batchY;
        var batchRadius = Math.floor( Math.sqrt( Math.pow( deltaBatchX, 2 ) + Math.pow( deltaBatchY, 2 ) ) ) + 1;
        return batchRadius;
    }
    
    var visibleBatchRadius = function()
    {
        var centerBatchX = MMAPBATCH.tileXToBatchX( centerTileX() );
        var centerBatchY = MMAPBATCH.tileYToBatchY( centerTileY() );
        
        var x = 0;
        var y = 0;
        var topLeftBatchRadius = batchRadiusForScreen(
            centerBatchX,
            centerBatchY,
            x, y );
        return topLeftBatchRadius;
    }
    
    var processBatchFlag = function( maximumDuration, batchFlag )
    {
        var time = Date.now();
        var keys = Object.keys( batchFlag );
        var count = 0;
        // pre order
        var firstKeys = [];
        var otherKeys = [];
        for ( var i in keys )
        {
            var k = keys[ i ];
            var pair = mathReverseCantorPair( k );
            var batchX = pair[ 0 ];
            var batchY = pair[ 1 ];
            var textureFlag = batchFlag[ k ].loadTexture;
            if ( textureFlag )
            {
                otherKeys.push( k );
            }
            else
            {
                firstKeys.push( k );
            }
        }
        var orderedKeys = firstKeys;
        for ( var i in otherKeys )
        {
            orderedKeys.push( otherKeys[ i ] );
            break; // process only one texture load per call
        }
        for ( var i in orderedKeys )
        {
            var k = orderedKeys[ i ];
            var pair = mathReverseCantorPair( k );
            var batchX = pair[ 0 ];
            var batchY = pair[ 1 ];
            var textureFlag = batchFlag[ k ].loadTexture;
            if ( textureFlag )
            {
                var tileX = MMAPBATCH.batchXToStartTileX( batchX );
                var tileY = MMAPBATCH.batchYToStartTileY( batchY );
                var endTileX = MMAPBATCH.batchXToEndTileX( batchX );
                var endTileY = MMAPBATCH.batchYToEndTileY( batchY );
                for ( var x = tileX; x < endTileX; x++ )
                {
                    for ( var y = tileY; y < endTileY; y++ )
                    {
                        if ( MMAPDATA.isValidCoordinates( x, y ) )
                        {
                            var tileId = MMAPDATA.tileId( x, y );
                            public.setTile( x, y, tileId );
                        }
                    }
                }
            }
            var visibleFlag = batchFlag[ k ].visible;
            if ( typeof visibleFlag != 'undefined' )
            {
                MMAPBATCH.setBatchVisible( batchX, batchY, visibleFlag );
            }
            var positionFlag = batchFlag[ k ].position;
            if ( typeof positionFlag != 'undefined' )
            {
                updateMapSpriteBatchPosition( batchX, batchY );
            }
            delete batchFlag[ k ];
            count++;
            if ( Date.now() - time > maximumDuration)
            {
                console.log('too much ' + count + '/' + keys.length );
                return;
            }
        }
        
    }
    
    var updateMapSpriteBatchPosition = function( batchX, batchY )
    {
        // note: x and y are screen coordinates
        var x = -m_cameraMapX * m_cameraScaleX + viewWidth() / 2;
        var y = -m_cameraMapY * m_cameraScaleY + viewHeight() / 2;
        MMAPBATCH.setBatchPosition( batchX, batchY, x, y );
        MMAPBATCH.setBatchScale( batchX, batchY, m_cameraScaleX, m_cameraScaleY );
    }
    
    // hold cantor indicies
    var m_batchFlag = {};
    
    public.draw = function( updatedTiles )
    {
        // remarks: one single call to texture change
        // is likely to cause a complete refresh of the
        // m_mapDisplay container, even if the
        // texture change occurs outside viewport.
        // under no texture change, calls to visible
        // may affect performance.
        // Container size raises the cost of refresh.
        // 1/ Possible strategy is to keep sprite grain
        // but regroup them into multiple, smaller
        // containers DONE
        // a call to visible or texture change may 
        // refresh smaller container instead,
        // leading to shorter delay
        // has ability to turn containers into cached
        // bitmap?
        // note: better performance reached when
        // visibility is controlled at higher level
        // 2/ the texture change is one of the
        // factor that leads to fps slowdown
        // consider performing texture change to
        // elements that come into view, and not
        // earlier. Impact may lead to stuttering during
        // scrolls DONE
        // 3/ stutering happens on scroll, which is
        // mitigated by a loading queue that process 
        // things until time is depleted
        // however position and visibility
        // must be set only if texture is loaded
        // so maybe one should perform
        // texture loading with a default transparent one
        // then replace it when needed?
        // 4/ container creation could also be in cause,
        // consider pooling?
        
        var time1 = Date.now();
        
        updateCameraVelocity();
        
        if ( m_cameraCenterTileXRendered === null )
        {
            
        }
        else
        {
            MMAPBATCH.setVisibilityFlagInRadius(
                m_batchFlag,
                m_cameraCenterTileXRendered,
                m_cameraCenterTileYRendered,
                m_cameraBatchRadiusRendered,
                false );
        }
        
        var currentCenterTileX = centerTileX();
        var currentCenterTileY = centerTileY();
        var currentRadius = visibleTileRadius();
        var currentBatchRadius = visibleBatchRadius();
        
        MMAPBATCH.setVisibilityFlagInRadius(
            m_batchFlag,
            currentCenterTileX,
            currentCenterTileY,
            currentBatchRadius,
            true );
            
        MMAPBATCH.setTextureFlagInNewBatch(
            m_batchFlag );
        
        MMAPBATCH.setTextureFlagInRadiusAndUpdatedTiles(
            m_batchFlag,
            currentCenterTileX,
            currentCenterTileY,
            currentBatchRadius,
            updatedTiles );
            
        MMAPBATCH.setPositionFlagInRadius(
            m_batchFlag,
            currentCenterTileX,
            currentCenterTileY,
            currentBatchRadius,
            true );
            
        var time2 = Date.now();
        
        var maximumDuration = 10;
        processBatchFlag( maximumDuration, m_batchFlag );
        
        var time3 = Date.now();
        
        // checking whether it is texture load
        if ( time3 - time2 > 16 )
        {
            console.log(time3 - time2 + 'f');
        }
        
        m_cameraMapXRendered = m_cameraMapX;
        m_cameraMapYRendered = m_cameraMapY;
        m_cameraScaleXRendered = m_cameraScaleX;
        m_cameraScaleYRendered = m_cameraScaleY;
        m_cameraCenterTileXRendered = currentCenterTileX;
        m_cameraCenterTileYRendered = currentCenterTileY;
        m_cameraBatchRadiusRendered = currentBatchRadius;
    }
    
    return public;
})();

function Update()
{
    g_updateTimestamp = Date.now();
    g_stats.begin();
    g_state();
    g_stats.end();
    g_frameCounter++;
    var endUpdateTimestamp = Date.now() - g_updateTimestamp;
    if ( endUpdateTimestamp > 1000/60.0 )
    {
        console.log( endUpdateTimestamp );
    }
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