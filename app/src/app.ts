import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, FreeCamera } from "@babylonjs/core";
//enum for states
enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
  private _canvas : HTMLCanvasElement;
  private _scene : Scene;
  private _engine : Engine;

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
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "gameCanvas";
    document.body.appendChild(canvas);
    return canvas;
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

  // private _render():void{
  //   // run the main render loop
  //   this._engine.runRenderLoop(() => {
  //     this._scene.render();
  //   });
  // }

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

  private async _goToStart():Promise<void>{
    // 로딩 UI 표시
    this._engine.displayLoadingUI();
    // 장면과 카메라 구성
    this._scene.detachControl(); // 초기화
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0,0,0,1);
    let camera = this._setupFreeCamera('camera1', Vector3.Zero(), scene,Vector3.Zero());
  }


  
}
new App();