//////////////////////////////////
//
//    JS IM Hangul
//        by Colspan (Miyoshi)
//         http://colspan.net/
//        License : MIT license
//
// depend JSIM.js,johab.js,prototype.js

var JS_IM_hangul = {
  methodName : "Hangul",
  version : "20080123",
  language : "Korean",
  author : "Colspan",
  params : {
    displayString : '한',
    listBox : false,
    inlineInsertion : true
  },
  process : function( keyStatus ){
    var outputStr="";

    if( ! keyCode.isAlphabet( keyStatus.inputCode ) ){//アルファベットではない場合は処理しない
      outputStr = null;
      return outputStr;
    }

		//Shiftキーの状態による母音と子音の処理
    var noShiftCharacterSet = "abcdfghijklmnsuvxyz";
		inputChar = ( keyStatus.shiftKey && ( noShiftCharacterSet.indexOf( keyStatus.inputChar.toLowerCase() ) == -1 ) ?
      keyStatus.inputChar.toUpperCase() :
		  keyStatus.inputChar.toLowerCase()
    );

		//変換開始
		if( isJasoKey( inputChar ) ){ // 作業文字列に入力文字を演算
			this.inlineBuffer = strPlusJasoKey( this.inlineBuffer, inputChar );
		}
    if( this.inlineBuffer.length == 2 ){ //文字が確定した
      outputStr = this.inlineBuffer.substring(0, 1);
      this.inlineBuffer = this.inlineBuffer.substring(1,2);
    }
		return outputStr;
  },
	backspace : function(){
    if( this.inlineBuffer.length == 0 ) return false;
	  this.inlineBuffer = strDeleteOneJaso( this.inlineBuffer );
    return true;
  }
}


var JS_IM_hangul4 = {
  methodName : "Hangul",
  version : "20080123",
  language : "Korean",
  author : "Colspan",
  params : {
    displayString : '한',
    listBox : false,
    inlineInsertion : true
  },
  commands : {

    combine : JSIM_dummyCommand,
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
  statementGenerator : function( eventObj ){
    var statement = {
      commandLength : 0,
      commands : [],
      keyStatus : eventObj.keyStatus,
      calledObj : eventObj.calledObj,
      JS_IM_Obj : this.JS_IM_Obj,
      externalJSON : null
    };
    // generate command and execute process
    // モード検出, イベント解釈, command選択
    // TODO
    switch( this.JS_IM_Obj.mode ){
        case "init":
            break;
        case "wait":
            break;
        case "input":
            break;
        case "convert":
            break;
        default:
            break;
    }
    return statement;
  },
  process : function( keyStatus ){
    var outputStr="";

    if( ! keyCode.isAlphabet( keyStatus.inputCode ) ){//アルファベットではない場合は処理しない
      outputStr = null;
      return outputStr;
    }

    //Shiftキーの状態による母音と子音の処理
    var noShiftCharacterSet = "abcdfghijklmnsuvxyz";
    inputChar = ( keyStatus.shiftKey && ( noShiftCharacterSet.indexOf( keyStatus.inputChar.toLowerCase() ) == -1 ) ?
      keyStatus.inputChar.toUpperCase() :
      keyStatus.inputChar.toLowerCase()
    );

    //変換開始
    if( isJasoKey( inputChar ) ){ // 作業文字列に入力文字を演算
      this.inlineBuffer = strPlusJasoKey( this.inlineBuffer, inputChar );
    }
    if( this.inlineBuffer.length == 2 ){ //文字が確定した
      outputStr = this.inlineBuffer.substring(0, 1);
      this.inlineBuffer = this.inlineBuffer.substring(1,2);
    }
    return outputStr;
  },
  backspace : function(){
    if( this.inlineBuffer.length == 0 ) return false;
    this.inlineBuffer = strDeleteOneJaso( this.inlineBuffer );
    return true;
  }
}



