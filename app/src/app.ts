import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";

import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
//enum for states
enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
  private _canvas : HTMLCanvasElement;
  private _engine : Engine;
  private _scene : Scene;
  private _cutScene : Scene;
  private _gamescene : Scene;
  

  private _state : State = State.START;// private _state : number = 0;

  constructor() {

    this._canvas = this._createCanvas();

    // initialize babylon scene and engine
    this._engine = new Engine(this._canvas, true);
    this._scene = new Scene(this._engine);
    
    var camera = this._setupArcRotateCamera();
    var light1 = this._setupLight();
    var model = this._setupModel();

    this._addEvent();
    this._render();
  }

  private _createCanvas(): HTMLCanvasElement {
    //Commented out for development
    document.documentElement.style["overflow"] = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    //create the canvas html element and attach it to the webpage
    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    this._canvas.id = "gameCanvas";
    document.body.appendChild(this._canvas);

    return this._canvas;
  }

  private _setupArcRotateCamera():ArcRotateCamera{
    const camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this._scene);
    camera.attachControl(this._canvas, true);
    return camera;
  }

  private _setupFreeCamera(camName:string, pos:Vector3, scene:Scene, target:Vector3):FreeCamera{
    let camera = new FreeCamera(camName,pos,scene);
    camera.target = target;
    return camera;
  }

  private _setupLight():HemisphericLight{
    var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);
    return light1;
  }

  private _setupModel():Mesh{
    var model: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this._scene);
    return model;
  }

  private _addEvent():void{
    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      console.log(ev.keyCode);
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && (ev.key === 'i' || ev.key === 'I')) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide();
        } else {
          this._scene.debugLayer.show();
        }
      }
    });
  }

  private async _render():Promise<void>{
    await this._goToStart();
    // run the main render loop
    this._engine.runRenderLoop(() => {

      switch(this._state){
        case State.START:
          this._scene.render();
          break;
        case State.CUTSCENE:
            this._scene.render();
            break;
        case State.GAME:
          this._scene.render();
          break;
        case State.LOSE:
          this._scene.render();
          break;
        default: break;
      }

      // resize 
      window.addEventListener('resize', ()=>{
        this._engine.resize();
      })

    });
  }

  private _setupScene():Scene{
    this._scene.detachControl(); // 초기화
    let scene = new Scene(this._engine);
    let camera = this._setupFreeCamera('camera1', Vector3.Zero(), scene,Vector3.Zero());
    scene.clearColor = new Color4(0,0,0,1);
    return scene;
  }

  private async _goToStart():Promise<void>{
    // 로딩 UI 표시
    this._engine.displayLoadingUI();

    // 장면과 카메라 구성
    let scene = this._setupScene();

    // GUI 설정 화면
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    guiMenu.idealHeight = 720;

    // // 버튼 생성
    const startBtn = Button.CreateSimpleButton("start", "PLAY")
    startBtn.width = 0.2;
    startBtn.height = "40px";
    startBtn.color = "white";
    startBtn.top = "-14px";
    startBtn.thickness = 0;
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startBtn);

    // // 핸들러 추가
    startBtn.onPointerDownObservable.add(()=> {
      this._goToCutScene();
      scene.detachControl(); // 마우스 중복 클릭 방지
    }); 

    // 장면 준비 완료 -> 로딩UI 숨기기 -> 저장된 장면 삭제 -> 새로운 장면으로 전환
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = scene;
    this._state = State.START;
  }

  private async _goToCutScene():Promise<void>{
    // 로딩 UI 표시
    this._engine.displayLoadingUI();
    
    // 장면과 카메라 구성
    this._cutScene = this._setupScene();

    // GUI--
    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("cutscene");
    
    // // 버튼 생성
    const nextBtn = Button.CreateSimpleButton("next", "NEXT")
    nextBtn.color = "white";
    nextBtn.thickness = 0;
    nextBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    nextBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    nextBtn.width = "64px";
    nextBtn.height = "64px";
    nextBtn.top = "-3%";
    nextBtn.left = "-12%";
    cutScene.addControl(nextBtn);

    // // 핸들러 추가
    nextBtn.onPointerDownObservable.add(()=> {
      this._goToGame();
    }); 

    // 장면 준비 완료 -> 로딩UI 숨기기 -> 저장된 장면 삭제 -> 새로운 장면으로 전환
    await this._cutScene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = this._cutScene;
    this._state = State.CUTSCENE;

    // 리소스 셋업 후 loading 완료
    var finishedLoading = false;
    await this._setUpGame().then(res =>{
      finishedLoading = true;
    })
  }
 
  private async _setUpGame():Promise<void>{
    let scene = new Scene(this._engine);
    this._gamescene = scene;

    // loading assets...
  }

  private async _goToGame():Promise<void>{
  
    // -- setup scene
    this._scene.detachControl();
    let scene = this._gamescene;
    scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098); // a color that fit the overall color scheme better
    let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
    camera.setTarget(Vector3.Zero());
    
    //--GUI--
    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    //dont detect any inputs from this ui while the game is loading
    scene.detachControl();

    //create a simple button
    const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
    loseBtn.width = 0.2
    loseBtn.height = "40px";
    loseBtn.color = "white";
    loseBtn.top = "-14px";
    loseBtn.thickness = 0;
    loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    playerUI.addControl(loseBtn);

    //this handles interactions with the start button attached to the scene
    loseBtn.onPointerDownObservable.add(() => {
        this._goToLose();
        scene.detachControl(); //observables disabled
    });

    //temporary scene objects
    var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

    // 장면 준비 완료 -> 로딩UI 숨기기 -> 저장된 장면 삭제 -> 새로운 장면으로 전환
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._state = State.GAME;
    this._scene = scene;
    //the game is ready, attach control back
    this._scene.attachControl();
  }

  private async _goToLose():Promise<void> {
    // 로딩 UI 표시
    this._engine.displayLoadingUI();

    // 장면과 카메라 구성
    let scene = this._setupScene();

    //--GUI--
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
    mainBtn.width = 0.2;
    mainBtn.height = "40px";
    mainBtn.color = "white";
    guiMenu.addControl(mainBtn);
    //this handles interactions with the start button attached to the scene
    mainBtn.onPointerUpObservable.add(() => {
        this._goToStart();
    });

    // 장면 준비 완료 -> 로딩UI 숨기기 -> 저장된 장면 삭제 -> 새로운 장면으로 전환
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = scene;
    this._state = State.LOSE;
  }

}
new App();