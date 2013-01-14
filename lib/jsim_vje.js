//////////////////////////////////
//
//    JS IM vje
//        by Colspan (Miyoshi)
//         http://colspan.net/
//        License : MIT license
//
// depend jsim_common.js,roma.js,jsim.js,prototype.js


/*
  2013/01/14 TODO
  done 予期せぬ任意入力による強制確定
  done ESCキーの挙動
  done 数字入力
  done カタカナ入力
  done ひらがな入力
  done GUIの表示位置更新処理の記述場所の見直し
*/

var JS_IM_vje4 = {
  methodName : "jsvje",
  version : "20130114",
  language : "Japanese",
  author : "Colspan",
  params : {
    displayString : '日',
    listBox : true,
    inlineInsertion : false
  },
  JSIM_Obj : null,
  localVars : { convertedResult:null, romajiBuffer:"" },
  commands : {
    result : null,
    accept : function( stmtObj ){
      var outputStr;
      if( stmtObj.JSIM_Obj.mode == 'convert' ){
        outputStr = stmtObj.JSIM_Obj.methodObj.utils.acceptAllSegments(stmtObj);
      }
      else outputStr = stmtObj.JSIM_Obj.inlineBuffer;
      stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer = "";
      stmtObj.JSIM_Obj.GUI.list.hide();
      stmtObj.JSIM_Obj.GUI.buffer.hide();

      var ignoreEvent_output =  ( outputStr == "" || !stmtObj.returnObj.ignoreEvent ? false :  true );

      stmtObj.returnObj = {
        outputStr : outputStr,
        ignoreEvent : ignoreEvent_output,
        inlineBuffer : "",
        mode : "input"
      };

      return stmtObj;
    },
    backToInput : function(stmtObj){
      inlineBuffer_output = roma2.hiragana(stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer).toString();
      stmtObj.JSIM_Obj.GUI.list.hide();
      stmtObj.returnObj = {
        outputStr : null,
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        mode : "input"
      };
      return stmtObj; // inputに戻す
    },
    backspace : function(stmtObj){
      var ignoreEvent_output = true;
      var inlineBuffer_output = "";
      var mode_output = stmtObj.JSIM_Obj.mode;
      switch( stmtObj.JSIM_Obj.mode ){
        case 'input' :
          if( stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer.length == 0 ){
            ignoreEvent_output = false;
            break;
          }
          /* ローマ字文字列を削ってひらがな1文字分を削除する */
          inlineBuffer_output = stmtObj.JSIM_Obj.inlineBuffer;
          var lastInlineBufferLength = inlineBuffer_output.length;
          while( lastInlineBufferLength == inlineBuffer_output.length ){
            stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer = stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer.substring(0,stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer.length-1);
            inlineBuffer_output = roma2.hiragana(stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer).toString();
          }
          stmtObj.JSIM_Obj.GUI.list.hide();
          break;
        case 'wait' :
        case 'convert' :
          mode_output = 'input';
          inlineBuffer_output = roma2.hiragana(stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer).toString();
          stmtObj.JSIM_Obj.GUI.list.hide();
          break;
      }

      stmtObj.returnObj = {
        outputStr : null,
        ignoreEvent : ignoreEvent_output,
        inlineBuffer : inlineBuffer_output,
        mode : mode_output
      };
      return stmtObj;
    },
    cancel :function(stmtObj){ // TODO
      stmtObj.JSIM_Obj.inlineBuffer = '';
      stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer = '';
      stmtObj.JSIM_Obj.GUI.buffer.hide();
      //TODO IEでフォームが初期化されるのを防ぐ TODO
      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : "",
        mode : "input"
      };
      return stmtObj;
    },
    convert : function( stmtObj ){
      if( stmtObj.JSIM_Obj.mode == "input" ){ // 変換処理開始
        JS_IM_YahooAPI.VJE.convert( stmtObj );
        stmtObj.returnObj = {
          outputStr : null,
          ignoreEvent : true,
          inlineBuffer : stmtObj.JSIM_Obj.inlineBuffer,
          localVars : { romajiBuffer : stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer },
          mode : "wait"
        };
      }
      else{ /* 予期しない変換要求の場合は強制的に input に戻す */
        stmtObj.returnObj = {
          outputStr : null,
          ignoreEvent : false,
          mode : "input"
        };
      }


      return stmtObj;
    },
    convert_callback : function( stmtObj ){ // callback
      if( stmtObj.JSIM_Obj.mode != 'wait' ) return; // 待ち状態じゃなかったら無視する
      stmtObj.JSIM_Obj.mode = 'convert';
      stmtObj.JSIM_Obj.methodObj.localVars.convertedResult = stmtObj.convertedJSON.Result;
      
      var segmentList = stmtObj.convertedJSON.Result.SegmentList.Segment;
      var tempCandidate;
      var result = new Object();
      var segment;
      result.segments = new Array();
      result.targetSegment = 0;
      
      // 受け取ったJSONデータを扱いやすい配列に格納する
      if( segmentList.length ){ // segmentListが配列の時
        for(var i=0;i<segmentList.length;i++){
          tempCandidate = segmentList[i].CandidateList.Candidate;
          segment = new Object();
          if( typeof tempCandidate == 'string' ){
            segment.candidates = new Array();
            segment.candidates[0] = tempCandidate;
          }
          else{
            segment.candidates = tempCandidate;
          }
          segment.targetCandidateNum = 0;
          result.segments[i] = segment;
        }
      }
      else{ // segmentListが1つだけの文節だけを含み、配列ではないとき
        result.segments[0] = new Object();
        tempCandidate = segmentList.CandidateList.Candidate;
        if( typeof tempCandidate == 'string' ){
          result.segments[0].candidates = new Array();
          result.segments[0].candidates[0] = tempCandidate;
        }
        else{
          result.segments[0].candidates = tempCandidate;
        }
        result.segments[0].targetCandidateNum = 0;
      }
      result.targetSegmentNum = 0;
      stmtObj.JSIM_Obj.methodObj.localVars.convertedResult = result;
      
      // GUI更新
      stmtObj.JSIM_Obj.GUI.list.update( stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.segments[ stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum ].candidates );
      stmtObj.returnObj.inlineBuffer = stmtObj.JSIM_Obj.methodObj.utils.generateSegmentsGUI(stmtObj);

      // 例外的にmethod側から更新(割り切り)
      stmtObj.JSIM_Obj.GUI.buffer.update( stmtObj.returnObj.inlineBuffer );

      stmtObj.returnObj.mode = "convert";
      return stmtObj;

    },
    combine : function( stmtObj ){
      var romajiBuffer_input = stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer;
      var inlineBuffer_input = stmtObj.JSIM_Obj.inlineBuffer;
      var inlineBuffer_output = null;
      var keyStatus = stmtObj.keyStatus;

      // ローマ字→ひらがな結合処理
      if( keyStatus.inputChar != null ){
        if( !romajiBuffer_input ) romajiBuffer_input = "";
        stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer = romajiBuffer_input + keyStatus.inputChar.toLowerCase();
        inlineBuffer_output = roma2.hiragana(stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer).toString();
      }

      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        mode : "input"
      };
      
      return stmtObj;
    },
    nextCandidate : function( stmtObj ){
      var romajiBuffer_input = stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer;
      var inlineBuffer_input = stmtObj.JSIM_Obj.inlineBuffer;
      var inlineBuffer_output = null;

      var segment = stmtObj.JSIM_Obj.methodObj.utils.getCurrentSegment( stmtObj );
      segment.targetCandidateNum += 1 + segment.candidates.length;
      segment.targetCandidateNum %= segment.candidates.length;


      inlineBuffer_output = stmtObj.JSIM_Obj.methodObj.utils.generateSegmentsGUI(stmtObj);
      stmtObj.JSIM_Obj.GUI.list.next();

      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        mode : "convert"
      };
      return stmtObj;
    },
    prevCandidate : function (stmtObj){
      var romajiBuffer_input = stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer;
      var inlineBuffer_input = stmtObj.JSIM_Obj.inlineBuffer;
      var inlineBuffer_output = null;
      
      var segment = stmtObj.JSIM_Obj.methodObj.utils.getCurrentSegment( stmtObj );
      segment.targetCandidateNum += -1 + segment.candidates.length;
      segment.targetCandidateNum %= segment.candidates.length;
      
      
      inlineBuffer_output = stmtObj.JSIM_Obj.methodObj.utils.generateSegmentsGUI(stmtObj);
      stmtObj.JSIM_Obj.GUI.list.prev();
      
      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        mode : "convert"
      };
      return stmtObj;
    },
    nextSegment : function( stmtObj ){
      stmtObj.JSIM_Obj.GUI.list.update( stmtObj.JSIM_Obj.methodObj.utils.nextSegment(stmtObj).candidates );
      
      inlineBuffer_output = stmtObj.JSIM_Obj.methodObj.utils.generateSegmentsGUI(stmtObj);

      stmtObj.JSIM_Obj.GUI.list.setSelectedCandidateNum( stmtObj.JSIM_Obj.methodObj.utils.getCurrentCandidateNum(stmtObj) );

      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        mode : "convert"
      };
      return stmtObj;
    },
    prevSegment : function( stmtObj ){
      stmtObj.JSIM_Obj.GUI.list.update( stmtObj.JSIM_Obj.methodObj.utils.prevSegment(stmtObj).candidates );
      
      inlineBuffer_output = stmtObj.JSIM_Obj.methodObj.utils.generateSegmentsGUI(stmtObj);
      
      stmtObj.JSIM_Obj.GUI.list.setSelectedCandidateNum( stmtObj.JSIM_Obj.methodObj.utils.getCurrentCandidateNum(stmtObj) );
      
      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        mode : "convert"
      };
      return stmtObj;
    },
    convertToKatakana : function( stmtObj ){
      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : roma2.katakana( stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer ).toString(),
        mode : "input"
      };
      return stmtObj;
    },
    convertToHiragana : function( stmtObj ){
      stmtObj.returnObj = {
        outputStr : "",
        ignoreEvent : true,
        inlineBuffer : roma2.hiragana( stmtObj.JSIM_Obj.methodObj.localVars.romajiBuffer ).toString(),
        mode : "input"
      };
      return stmtObj;
    }
  },
  utils : {
    generateSegmentsGUI : function( stmtObj ){
      var segments = this.getAllSegments( stmtObj );
      var targetSegmentNum = stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum;
      var divElem = document.createElement("div");
      var spanElem,i;
      for( i = 0; i < segments.length; i++ ){
        spanElem = document.createElement("span");
        spanElem.innerHTML = segments[i];
        if( targetSegmentNum == i ){
          JSIM_setClassName( spanElem, 'jsim_target_segment' );
        }
        divElem.appendChild(spanElem);
      }
      return divElem.innerHTML;
    },
    getCurrentCandidate : function( stmtObj ){
      var result = stmtObj.JSIM_Obj.methodObj.localVars.convertedResult;
      var segment = result.segments[ result.targetSegmentNum ];
      return segment.candidates[ segment.targetCandidateNum ];
    },
    getCurrentCandidateNum : function( stmtObj ){
      var result = stmtObj.JSIM_Obj.methodObj.localVars.convertedResult;
      var segment = result.segments[ result.targetSegmentNum ];
      return segment.targetCandidateNum;
    },
    getAllSegments : function( stmtObj ){
      var tempSegment;
      var segments = stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.segments;
      var outputSegments = new Array();
      for(var i=0;i<segments.length;i++){
        tempSegment = segments[i];
        outputSegments[i] = tempSegment.candidates[ tempSegment.targetCandidateNum ];
      }
      return outputSegments;
    },
    acceptAllSegments : function( stmtObj ){
      return this.getAllSegments(stmtObj).join("");
    },
    nextSegment : function( stmtObj ){
      if( stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum < stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.segments.length - 1 ) stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum ++;
      return this.getCurrentSegment( stmtObj );
    },
    prevSegment : function( stmtObj ){
      if( stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum > 0 ) stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum --;
      return this.getCurrentSegment( stmtObj );
    },
    getCurrentSegment : function( stmtObj ){
      return stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.segments[ stmtObj.JSIM_Obj.methodObj.localVars.convertedResult.targetSegmentNum ];
    },
    nextCandidate : function( stmtObj ){
      var segment = this.getCurrentSegment( stmtObj );
      segment.targetCandidateNum += 1 + segment.candidates.length;
      segment.targetCandidateNum %= segment.candidates.length;
    },
    prevCandidate : function( stmtObj ){
      var segment = this.getCurrentSegment( stmtObj );
      segment.targetCandidateNum += -1 + segment.candidates.length;
      segment.targetCandidateNum %= segment.candidates.length;
    }
  },
  init : function(){
    this.JSIM_Obj.mode = 'input'
  },
  callback : function( data ){
    return this.commands.convert_callback( data );
  },
  statementGenerator : function( eventObj ){
    var JSIM_Obj = this.JSIM_Obj;

    var statement = {
      commands : [],
      keyStatus : eventObj.keyStatus,
      calledObj : eventObj.calledObj,
      JSIM_Obj : this.JSIM_Obj,
      extJSON : null,
      returnObj : {outputStr:"",ignoreEvent:true,inlineBuffer:"",mode:""},
      errorFlag : false
    };

    console.log( this.JSIM_Obj.mode + ":" + eventObj.keyStatus.inputCode + ":" + eventObj.keyStatus.inputChar );

    switch( this.JSIM_Obj.mode ){
      case 'init' : // 初期化直後
      case 'input' : // 入力モード
        if( ! eventObj.keyStatus.inputChar ) switch( eventObj.keyStatus.inputCode ){
          case 8: // Back Space
            statement.commands = [
                                  this.commands.backspace
                                  ];
            break;
          case 27 : // ESC
            statement.commands = [
                                  this.commands.cancel
                                  ];
            break;
          case 32 : // Space
            if( JSIM_Obj.methodObj.localVars.romajiBuffer == '' ) break; // romajiBufferが空ならそのままスペースを入力する
            statement.commands = [
                                  this.commands.convert
                                  ];
            break;
          case 10 : // Enter
          case 13 : // Enter
            statement.commands = [
                                  this.commands.accept
                                  ];
            break;
          case 117 : // F6
            statement.commands = [
                                  this.commands.convertToHiragana,
                                  this.commands.accept
                                  ];
            break;
          case 118 : // F7
            statement.commands = [
                                  this.commands.convertToKatakana,
                                  this.commands.accept
                                  ];
            break;
          default: // 数字や記号など
            statement.commands = [
                                  this.commands.accept
                                  ];
            statement.returnObj.ignoreEvent = false;
            break;
        }
        else{
          statement.commands = [
                                this.commands.combine
                                ];
        }
        break;
      case 'wait' : // コールバック待ち
        switch( eventObj.keyStatus.inputCode ){
          case 8: // Back Space
            statement.commands = [
                                  this.commands.backspace
                                  ];
            break;
          case 27 : // ESC
           // todo inputに戻るコマンドを実行する
            break;
          case 32 : // Space
            break;
          default :
            break;
        }
        statement.returnObj.ignoreEvent = true;
        break;
      case 'convert' : // 変換動作中
        switch( eventObj.keyStatus.inputCode ){
          case 8: // Back Space
            statement.commands = [
                                  this.commands.backspace
                                  ];
            break;
          case 27 : // ESC
            // TODO 取り消す
            statement.commands = [
                                  this.commands.backToInput
                                  ];
            break;
          case 38 : // Up
            statement.commands = [
                                  this.commands.prevCandidate
                                  ];
            break;
          case 32 : // Space
          case 40 : // Down
            statement.commands = [
                                  this.commands.nextCandidate
                                  ];
            break;
          case 37 : // Left
            statement.commands = [
                                  this.commands.prevSegment
                                  ];
            break;
          case 39 : // Right
            statement.commands = [
                                  this.commands.nextSegment
                                  ];
            break;
          case 117 : // F6
            statement.commands = [
                                  this.commands.convertToHiragana,
                                  this.commands.accept
                                  ];
            break;
          case 118 : // F7
            statement.commands = [
                                  this.commands.convertToKatakana,
                                  this.commands.accept
                                  ];
            break;
          case 10 : // Enter
          case 13 : // Enter
            statement.commands = [
                                  this.commands.accept
                                  ];
            break;
          default : // 変換キー以外であれば確定して次へ
            statement.commands = [
                                  this.commands.accept
                                  ];
            if( eventObj.keyStatus.inputChar ) statement.commands.push( this.commands.combine ); // 結合可能な文字列が続く場合には変換処理も同時に行う
            else statement.returnObj.ignoreEvent = false; //その他の文字は即入力を受け付ける
            break;
        }
        break;
      default :
        break;
    }
    console.log( "output : statement" );
    console.log( statement );
    return statement;
    
  }
}

var temp_YahooAPI_VJE = {
  callbackObj : null,
  lastRequestElem : null,
  onload : function( data ){
//    try{
      this.callbackObj.convertedJSON = data;
      this.callbackObj.JSIM_Obj.methodObj.commands.convert_callback( this.callbackObj );
//    }
//    catch( e ){
//      JS_IM_YahooAPI.retryRequest();
//      console.log("tmp_YahooAPI_VJE Error");
//      console.log('申し訳ありません。通信に問題がありました。数秒待ってから変換をやり直してください。現在この問題の原因を特定中です。');
//    }
  }
}
var JS_IM_YahooAPI = {
  proxy : 'http://colspan.net/experiment/jsim/proxy/xml2json.cgi',
  lastQuery : null,
  requestCount : 0,
  request : function( query ){
    this.lastQuery = query;
    try{
      var script = document.createElement('script');
      script.charset = 'UTF-8';
//      script.src = 'lib/vje_dummy.js'; // dummy
      script.src = this.proxy + '?' + query;
      document.body.appendChild(script);
    }
    catch( e ){
      // error
      console.log("error: 日本語変換辞書データを取得できません");
    }
  },
  retryRequest : function(){
    setTimeout( 'JS_IM_YahooAPI.request( "' + this.lastQuery + '" )', 200 );
  },
  VJE : {
    convert : function( stmtObj ){
      var str = stmtObj.JSIM_Obj.inlineBuffer;
      var query = 'sentence=' + str;
      JS_IM_YahooAPI.request( query );
      temp_YahooAPI_VJE.callbackObj = stmtObj;
    }
  }
}
