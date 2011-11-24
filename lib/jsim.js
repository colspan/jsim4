//////////////////////////////////
//
//    JS IM Library
//        by Colspan (Miyoshi)
//         http://colspan.net/
//        License : MIT license
//
// depend jsim_common.js,jsim_keycode.js,jsim_caret.js


function JSIM_setClassName( targetElement, className ){
  targetElement.className = className;
  if( targetElement.setAttribute ) targetElement.setAttribute( "class", className );
}

function debug_output( string ){
  document.getElementById("debug").innerHTML = string;
}

var JSIM = Class.create();
JSIM.prototype = {
  version : "2011XXXX",
  author : "Colspan",
  isEnabled : false,// 有効か無効か
  methodObj : null,// JSIM_Methodの形式のIMオブジェクト
  imeBox : null,// 乗っ取るelement( textarea or input )
  workingPhase : null,// 動作フェーズ
  inlineInputting : false,// インライン入力を有効にするか
  processCounter : 0, // counter for debug
  mode : "init", // IME Mode
  inlineBuffer : '',
  initialize : function(formObj,methodObj){
    var _this = this;
    this.imeBox = formObj;
    this.methodObj = new JSIM_Method( methodObj );
    this.methodObj.JSIM_Obj = this;
    var keyProcess = function(e){
      if( !event ) var event = e;
      var ignoreEvent = _this.execute( event );

      // debug
//      _this.processCounter++;
//      document.getElementById("debug").innerHTML = _this.processCounter;

      if( ignoreEvent ){
        if( event.preventDefault ) event.preventDefault();
        else if( event.returnValue ) event.returnValue = false;
        return false;
      }
      return true;
    }
    var acceptString = function(){
      if( _this.isEnabled ) JSIM_commonCommands.accept({JSIM_Obj:this});
    }
    var ignoreKeyUp = function(e){ // Firefox on Linuxにおける問題を解決
      if( _this.isEnabled ){
        if( e.preventDefault ) e.preventDefault();
        else if( e.returnValue ) e.returnValue = false;
        return false;
      }
      return true;
    }

    JSIM_Common.addEvent(this.imeBox, "blur", acceptString, false);
    JSIM_Common.addEvent(this.imeBox, "mousedown", acceptString, false);

    ///// キー入力関連イベント取得 /////
    /*
      ** 連打対策 **
      Windows環境ではonkeydownによって長押しによる連打が可能
      Linux版Firefoxではonkeypressによって長押しによる連打が可能
    */
    if( JSIM_Common.Browser.WebKit_iPhone ){
        JSIM_Common.addEvent(this.imeBox, "keypress", keyProcess, false);
    }
    else if( JSIM_Common.Browser.IE || JSIM_Common.Browser.WebKit ){
        JSIM_Common.addEvent(this.imeBox, "keydown", keyProcess, false);
    }
    else if( JSIM_Common.Browser.Gecko ){ // Gecko
//        this.imeBox.onkeypress = keyProcess;
        JSIM_Common.addEvent(this.imeBox, "keypress", keyProcess, false);
    }

    // Firefox on Linuxにおける問題を解決
    JSIM_Common.addEvent(this.imeBox, "keyup", ignoreKeyUp, false);

    // GUI 初期化

//    if( this.methodObj.params.listBox || ! this.methodObj.params.inlineInsertion ){
      this.GUI = new JSIM_GUI( this );
//    }

    this.GUI.stateDisplay.init();
    if( this.methodObj.params.listBox ){
      this.GUI.list.init();
    }
    if( this.methodObj.params.inlineInsertion ){
      // do nothing
    }
    else{
      this.GUI.buffer.init();
    }

    // 起動
    this.enable();

  },
  execute : function( e ){
    if( e.fromJSIMCallback ){
      var event = e;
    }
    else if( !event ){
      var event = e;
    }
    var eventObj  = this.eventFetcher( event );
    var stmtObj    = this.statementGenerator( eventObj );
    if( ! stmtObj ){// statement作成失敗
      return false;
    }
    var returnObj = this.process( stmtObj );
    if( ! returnObj ){// process失敗
      return false;
    }
    var lastInlineBuffer = this.inlineBuffer;

    // 状態更新
    this.inlineBuffer = returnObj.inlineBuffer;
    this.mode = returnObj.mode;

    if( this.methodObj.params.inlineInsertion ){ // form update
      for( i=0; i<lastInlineBuffer.length; i++ ) Caret.backSpace( this.imeBox ); // テキストボックスからインライン文字列を取り除く
    }
    else{
      // TODO GUI update
    }

    if( returnObj.outputStr.length > 0 ){
      Caret.nowCaretPosPutWord( this.imeBox, returnObj.outputStr );//確定文字列をテキストボックスに挿入      
    }

    if( this.methodObj.params.inlineInsertion && this.inlineBuffer.length > 0 ){
      Caret.nowCaretPosPutWord( this.imeBox, this.inlineBuffer );//テキストボックスに挿入
    }

    return returnObj.ignoreEvent;
  },
  eventFetcher : function( e ){
    var keyStatus = keyCode.getKeyStatus( e );
    var eventObj = {};
    eventObj.keyStatus = keyStatus;
    if( e.fromJSIMCallback ){
      eventObj.fromJSIMCallback = true;
      eventObj.calledObj = e.calledObj; // 呼び出し元Obj TODO
    }
    return eventObj;
  },
  statementGenerator : function( eventObj ){
    var stmtObj = {JSIM_Obj:this};
    // 起動制御
    if( this.methodObj == null ) return false; // methodが指定されていないとき

    var keyStatus = eventObj.keyStatus;    

    switch( keyStatus.keyCode ){
      case 16 : // Shift
      case 17 : // Ctrl
        // TODO 無視
        break;
      case 224 :// Meta
        // 確定
        stmtObj.commands = [
                              JSIM_commonCommands.accept
                              ];
        break;
      case 8 :  // BackSpace
        stmtObj = this.methodObj.statementGenerator( eventObj );
        break;
      default:
        if( keyStatus.ctrlKey || keyStatus.altKey || keyStatus.metaKey ){ // 特殊キーが押されている
          if( keyCode.isAlphabet( keyStatus.inputCode ) ){
            // 確定
            stmtObj.commands = [
                                JSIM_commonCommands.accept
                                ];
            break;
          }
        }
        if( keyStatus.inputCode == 32 && keyStatus.shiftKey ){ // Shift + Space なら toggle する
          stmtObj.commands = [
                              JSIM_commonCommands.accept,
                              JSIM_commonCommands.toggle
                              ];
          break;
        }

        stmtObj = this.methodObj.statementGenerator( eventObj );

        break;
    }
    return stmtObj;

  },
  process : function ( stmtObj ){ // statement実行
    var returnObj, stmtObj_input, stmt_output, i;
    if( stmtObj.commands && typeof(stmtObj.commands) == 'object' && stmtObj.commands.length > 0 ){
      stmtObj_input = stmtObj;
      for(i=0;i<stmtObj.commands.length;i++){
        stmtObj_output = stmtObj.commands[i]( stmtObj_input );
        if( stmtObj_output.errorFlag ) break;
        stmtObj_input = stmtObj_output;
      }
      returnObj = stmtObj_output.returnObj;
    }
    else{
      returnObj = null;
    }
    return returnObj;
  },
  toggle : function(){
    if( this.isEnabled ) this.disable();
    else this.enable();
  },
  enable : function(){
    this.isEnabled = true;
    this.combiningStr = "";
    //    this.originalBackgroundColor = this.imeBox.style.background;
    //   this.imeBox.style.background = "#FFF0F0";
    this.GUI.stateDisplay.show();
    this.imeBox.focus();
  },
  disable : function( stmtObj ){
    this.isEnabled = false;
    this.combiningStr = "";
    //    this.imeBox.style.background = this.originalBackgroundColor;
    this.GUI.stateDisplay.hide();
    this.imeBox.focus();
  }
}
/*
 stmtObj_template = {
   commandLength : 2;
   commands : [
    function( stmt_input ){
    var stmt_output;
    return stmt_output;
    },
    function( stmt_input ){
    var stmt_output;
    return stmt_output;
    }
   ],
   keyStatus : {
     ctrlKey : false,
     altKey : false,
     metaKey : false,
     shiftKey : false,
     keyCode : 10,
     charCode : 10,
     inputChar : 'a',
     inputCode : 10
   },
   eventObj : null,
   JSIM_Obj : null,
   extJSON : {},
   returnObj : null,
   errorFlag : false
 };
 */


var JSIM_commonCommands = {
  accept : function( stmtObj ){
    var outputStr = '';
    var _this = stmtObj.JSIM_Obj;
    if( ! _this.isEnabled ) return;
    if( _this.inlineBuffer != '' ){
      outputStr = _this.inlineBuffer;
    }
    stmtObj.returnObj = {
      outputStr : outputStr,
      ignoreEvent : false,
      inlineBuffer : '',
      mode : 'input'
    };
    return stmtObj;
  },
  clear : function( stmtObj ){
    var _this = stmtObj.JSIM_Obj;
    _this.combiningStr = ""
    _this.imeBox.focus();
    _this.imeBox.value = "";
    stmtObj.returnObj = {
      outputStr : '',
      ignoreEvent : false,
      inlineBuffer : '',
      mode : 'input'
    };
    return stmtObj;
  },
  selectall : function( stmtObj ){
    var _this = stmtObj.JSIM_Obj;
    _this.imeAccept();
    _this.imeBox.focus();
    _this.imeBox.select();
    stmtObj.returnObj = {
      outputStr : '',
      ignoreEvent : false,
      inlineBuffer : '',
      mode : 'input'
    };
    return stmtObj;
  }
};




var JSIM_GUI = Class.create();
JSIM_GUI.prototype = {
  version : "20081020",
  author : "Colspan",
  JSIM_Obj : null,
  initialize : function( JSIM_Obj ){
    this.stateDisplay = JSIM_Common.cloneObj( JSIM_GUI.prototype.stateDisplay );
    this.stateDisplay.JSIM_Obj = this.buffer.JSIM_Obj = this.list.JSIM_Obj = this.JSIM_Obj = JSIM_Obj;
    this.stateDisplay.parentObj = this.buffer.parentObj = this.list.parentObj = this;
  },
    stateDisplay : {
      elem : null,
      elemId : null,
      init : function(){
        var imeBox = this.JSIM_Obj.imeBox;
        var offset = JSIM_Common.cumulativeOffset( imeBox );
        var stateDisplayElem = document.createElement( "div" );
        stateDisplayElem.style.fontSize = '12px';
        stateDisplayElem.style.textAlign = 'center';
        stateDisplayElem.style.width = '20px';
        stateDisplayElem.style.height = '20px';
        stateDisplayElem.style.border = 'solid 1px #000';
        stateDisplayElem.style.background = "#FFC";
        stateDisplayElem.style.position = 'absolute';
        stateDisplayElem.style.top = offset.top  + imeBox.offsetHeight - 15 + 'px';
        stateDisplayElem.style.left = offset.left + imeBox.offsetWidth -15 + 'px';
        stateDisplayElem.style.visibility = "hidden";
        this.elem = stateDisplayElem;
        document.body.appendChild( this.elem );

        this.setString( this.JSIM_Obj.methodObj.params.displayString );

      },
      show : function(){
        this.elem.style.visibility = "visible";
      },
      hide : function(){
        this.elem.style.visibility = "hidden";
      },
      setString : function( string ){
        this.elem.innerHTML = string;
      }
    },
    buffer : {
      JSIM_Obj : null,
      elem : null,
      init : function(){
        var bufferBoxElem = document.createElement("div");
        JSIM_setClassName( bufferBoxElem, "jsim_bufferbox" );

        document.body.appendChild( bufferBoxElem );
        this.elem = bufferBoxElem;
      },
      update : function( bufferStr ){
        if( bufferStr == '' ){
          this.hide();
          return;
        }
        this.elem.innerHTML = bufferStr;
        this.elem.style.width = ( ( JSIM_Common.stripTags(bufferStr).length * 11 ) + 15 ) + "px";
        this.flush();
      },
      flush : function(){
        this.elem.style.visibility = "visible";
      },
      hide : function(){
        this.elem.style.visibility = "hidden";
      },
      setPosition : function( left, top ){
        this.elem.style.top = top + "px";
        this.elem.style.left = left + "px";
      }
    },
    list : {
      JSIM_Obj : null,
      elem : null,
      candidateElems : null,
      selectedCandidateNum : 0,
      init : function(){
        var listBoxElem = document.createElement("ul");
        JSIM_setClassName( listBoxElem, "jsim_listbox" );

        var imeBoxPosition = JSIM_Common.cumulativeOffset(this.JSIM_Obj.imeBox);
        listBoxElem.style.top = imeBoxPosition.top + 30 + "px";
        listBoxElem.style.left = imeBoxPosition.left + this.JSIM_Obj.imeBox.offsetWidth + "px";

        listBoxElem.style.background = "#FFE";
        listBoxElem.style.listStyleType = "none";
        listBoxElem.style.listStylePosition = "inside";
        listBoxElem.style.visibility = "hidden";
        listBoxElem.style.border = "solid 1px #333";
        listBoxElem.style.padding = "0 3px 3px 3px";
        listBoxElem.style.margin = "0";
        listBoxElem.style.position = "absolute";
        listBoxElem.style.width = "200px";

        document.body.appendChild( listBoxElem );
        this.elem = listBoxElem;
        this.candidateElems = new Array();
      },
      next : function(){
        this.selectedCandidateNum += 1 + this.candidateElems.length;
        this.selectedCandidateNum %= this.candidateElems.length;
        this.flush(); // 背景色再描画
      },
      prev : function(){
        this.selectedCandidateNum += -1 + this.candidateElems.length;
        this.selectedCandidateNum %= this.candidateElems.length;
        this.flush(); // 背景色再描画
      },
      update : function(listArray){ // 配列書き換え
        var i,length;
        length = this.candidateElems.length;
        for(i=0;i<length;i++){
          this.elem.removeChild( this.candidateElems[i] );
        }
        this.candidateElems = new Array();
        if( typeof listArray == 'string' ){
          var candidate = document.createElement("li");
          candidate.innerHTML = listArray;
          this.elem.appendChild( candidate );
          this.candidateElems[i] = candidate;
        }
        else{
          length = listArray.length;
          for(i=0;i<length;i++){
            var candidate = document.createElement("li");
            candidate.innerHTML = listArray[i];
            this.elem.appendChild( candidate );
            this.candidateElems[i] = candidate;
          }
        }
        this.selectedCandidateNum = 0;
        this.flush();
      },
      flush : function(){ // リスト描画
        this.elem.style.visibility = "visible";
        var length = this.candidateElems.length;
        var pos = this.selectedCandidateNum;
        var color,background;
        for(i=0;i<length;i++) if( i == pos ) {
          JSIM_setClassName( this.candidateElems[i], "jsim_listbox_li_selected" );
        }
        else{
          JSIM_setClassName( this.candidateElems[i],  "" );
        }

        // 描画位置設定
        var bufferElem = this.JSIM_Obj.GUI.buffer.elem;
        if( bufferElem ){
          var bufferElemPosition =  JSIM_Common.cumulativeOffset( bufferElem );
          this.elem.style.left = bufferElemPosition.left + "px";
          this.elem.style.top = bufferElemPosition.top + bufferElem.offsetHeight + "px";
        }
      },
      hide : function(){
    //        this.update( new Array() );
        this.elem.style.visibility = "hidden";
      },
      setSelectedCandidateNum : function( num ){
        this.selectedCandidateNum = num;
        this.flush();
      },
      setPosition : function( top, left ){
        this.elem.style.top = top + "px";
        this.elem.style.left = left + "px";
      }
    }
};

var JSIM_Method = Class.create();
JSIM_Method.prototype = {
  methodName : "",
  version : "",
  language : "",
  author : "",
  extension : { // 独自拡張領域
    methodObj : null
  },
  JSIM_Obj : null, // 親オブジェクト
  params : { // 親に渡す情報
    displayString : 'skelton',
    listBox : false,
    inlineInsertion : true
  },
  init : function (){
  },
  commands : {
    combine : JSIM_dummyCommand,
    backspace : JSIM_dummyCommand,
    convert : JSIM_dummyCommand,
    showCandidates : JSIM_dummyCommand,
    hideCandidates : JSIM_dummyCommand,
    nextCandidate : JSIM_dummyCommand,
    prevCandidate : JSIM_dummyCommand,
    nextPhrase : JSIM_dummyCommand,
    prevPhrase : JSIM_dummyCommand,
    acceptPhrase : JSIM_dummyCommand,
    lengthenPhrase : JSIM_dummyCommand,
    shortenPhrase : JSIM_dummyCommand,
    showInstantCandidate : JSIM_dummyCommand,
    hideInstantCandidate : JSIM_dummyCommand,
    acceptInstanceCandidate : JSIM_dummyCommand,
  },
  initialize : function(functionObj){
    var valueList = ["init","methodName","version","language","author","commands","extension","params","statementGenerator"];
    if( functionObj ){
      for( i=0;i<valueList.length;i++ ){
        switch( typeof functionObj[valueList[i]] ){
            case 'function' :
                this[valueList[i]] = functionObj[valueList[i]];
            break;
            case 'object' :
                this[valueList[i]] = JSIM_Common.cloneObj( functionObj[valueList[i]] );
            break;
        }
      }
      this.init();
    }
    this.extension.methodObj = this;
  }
}

// JSIM Method Sample
var JSIM_toUpperCase = {
  methodName : "toUpperCase",
  version : "20080123",
  language : "English",
  author : "Colspan",
  process : function( keyStatus ){
    var outputStr = keyStatus.inputChar.toUpperCase();
    return outputStr;
  }
}
