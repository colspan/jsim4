//////////////////////////////////
//
//    JS IM Hangul
//        by Colspan (Miyoshi)
//         http://colspan.net/
//        License : MIT license
//
// depend JSIM.js,johab.js,prototype.js

var JSIM_hangul = {
  methodName : "Hangul",
  version : "20130114",
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


var JSIM_hangul4 = {
  methodName : "Hangul",
  version : "2011XXXX",
  language : "Korean",
  author : "Colspan",
  params : {
    displayString : '한',
    listBox : false,
    inlineInsertion : true
  },
  commands : {
    combine : function( stmtObj ){
      var keyStatus = stmtObj.keyStatus;
      //Shiftキーの状態による母音と子音の処理
      var noShiftCharacterSet = "abcdfghijklmnsuvxyz";
      var inputChar = null;
      var outputStr = '';

      // 文字正規化
      inputChar = ( keyStatus.shiftKey && ( noShiftCharacterSet.indexOf( keyStatus.inputChar.toLowerCase() ) == -1 ) ?
                   keyStatus.inputChar.toUpperCase() :
                   keyStatus.inputChar.toLowerCase()
                   );

      //変換開始
      var inlineBuffer_input = stmtObj.JSIM_Obj.inlineBuffer;
      var inlineBuffer_output = null;

      if( isJasoKey( inputChar ) ){ // 作業文字列に入力文字を演算
        inlineBuffer_output = strPlusJasoKey( inlineBuffer_input, inputChar );
      }
      if( inlineBuffer_output.length == 2 ){ //文字が確定した
        outputStr = inlineBuffer_output.substring(0, 1);
        inlineBuffer_output = inlineBuffer_output.substring(1,2);
      }

      stmtObj.returnObj = {
        outputStr : outputStr,
        ignoreEvent : true,
        inlineBuffer : inlineBuffer_output,
        extParams : {},
        mode : "input"
      };
      
      return stmtObj;
    },
    backspace : function( stmtObj ){
      var inlineBuffer_input = stmtObj.JSIM_Obj.inlineBuffer;
      var inlineBuffer_output = '';
      var ignoreEvent = null;
      if( inlineBuffer_input.length == 0 ) ignoreEvent = false;
      else{
        inlineBuffer_output = strDeleteOneJaso( inlineBuffer_input );
        ignoreEvent = true;
      }

      stmtObj.returnObj = {
        outputStr : '',
        ignoreEvent : ignoreEvent,
        inlineBuffer : inlineBuffer_output,
        extParams : {},
        mode : "input"
      };
      
      return stmtObj;
    },
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
  JSIM_Obj : null,
  statementGenerator : function( eventObj ){
    var statement = {
      commands : [],
      keyStatus : eventObj.keyStatus,
      calledObj : eventObj.calledObj,
      JSIM_Obj : this.JSIM_Obj,
      extParams : {},
      returnObj : null
    };
    // generate command and execute process
    // モード検出, イベント解釈, command選択
    // TODO
    switch( this.JSIM_Obj.mode ){
      case "init":
      case "input":
        // Backspace
        if( eventObj.keyStatus.keyCode == 8 ){
          statement.commands = [
                                this.commands.backspace
                                ];
          break;         
        }
        

        if( ! keyCode.isAlphabet( eventObj.keyStatus.inputCode ) ){ //アルファベットではない場合は確定してしまう
          statement.commands = [
                                JSIM_commonCommands.accept
                                ];
          break;
        }

        statement.commands = [
                              this.commands.combine
                              ];
        break;
      default:
        break;
    }
    return statement;
  }
}

/*
 // TODO
 switch( this.JSIM_Obj.mode ){
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
 */



