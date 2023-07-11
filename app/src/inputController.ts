import { ActionManager, ExecuteCodeAction, Scalar, Scene } from "@babylonjs/core";

export class PlayerInput {

  public inputMap : any;
  public vertical : number;
  public verticalAxis : number;
  public horizontal : number;
  public horizontalAxis : number;
  public dashing: boolean;
  public jumpKeyDown: boolean;

  constructor(scene:Scene){
    scene.actionManager = new ActionManager(scene);

    this.inputMap={};
    scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger,(evt) =>{
      this.inputMap[evt.sourceEvent.key] = (evt.sourceEvent.type == "keydown"); // true or false
    }));
    scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger,(evt)=>{
      this.inputMap[evt.sourceEvent.key] = (evt.sourceEvent.type == "keydown"); // 키 업 이벤트 발생시, false 입력
    }));        

    scene.onBeforeRenderObservable.add(() => {
      this._updateFromKeyboard();
    });
  }

  private _updateFromKeyboard() {
    //move
    if(this.inputMap['ArrowUp']) {
      this.vertical = Scalar.Lerp(this.vertical,1,0.2);
      this.verticalAxis = 1;
    } else if (this.inputMap['ArrowDown']) {
      this.vertical = Scalar.Lerp(this.vertical,-1,0.2);
      this.verticalAxis = -1;
    } else {
      this.vertical = 0;
      this.verticalAxis = 0;
    }

    if(this.inputMap['ArrowLeft']) {
      this.horizontal = Scalar.Lerp(this.horizontal,-1,0.2);
      this.horizontalAxis = -1;
    } else if (this.inputMap['ArrowRight']) {
      this.horizontal = Scalar.Lerp(this.horizontal,1,0.2);
      this.horizontalAxis = 1;
    } else {
      this.horizontal = 0;
      this.horizontalAxis = 0;
    }

    //dash
    if (this.inputMap["Shift"]) {
      this.dashing = true;
    } else {
      this.dashing = false;
    }

    //Jump Checks (SPACE)
    if (this.inputMap[" "]) {
      this.jumpKeyDown = true;
    } else {
      this.jumpKeyDown = false;
    }    
  }

}