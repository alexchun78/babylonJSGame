import { ArcRotateCamera, Mesh, Quaternion, Ray, Scene, ShadowGenerator, TransformNode, UniversalCamera, Vector3 } from "@babylonjs/core";
import { PlayerInput } from "./inputController";

export class Player extends TransformNode  {

  public camera;
  public scene : Scene;  
  
  // player 
  public mesh : Mesh;

  private _camRoot : TransformNode;
  private _yTilt : TransformNode;
  private _input: PlayerInput;

  // static
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
  private static readonly PLAYER_SPEED: number = 0.45;
  private static readonly JUMP_FORCE: number = 0.80;
  private static readonly GRAVITY: number = -2.8;
  private static readonly DASH_TIME: number = 10;
  private static readonly DASH_FACTOR: number = 2.5;

  // player movement
  private _deltaTime: number = 0; 
  private _moveDirection: Vector3 = new Vector3();
  private _h: number;
  private _v: number;
  private _inputAmt: number;

  // gravity, ground direction, jumping
  private _gravity: Vector3 = new Vector3();
  private _grounded: boolean;
  private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
  private _jumpCount: number = 1;
  private _canDash: boolean = true; 
  public dashTime: number = 0;
  private _dashPressed: boolean;


  constructor(assets, scene:Scene, shadowGenerator:ShadowGenerator,input?){
    super("Player", scene);

    this.scene = scene;
    this._setupPlayerCamera();

    this.mesh = assets.mesh;
    this.mesh.parent = this;

    this.scene.getLightByName("sparklight").parent = this.scene.getTransformNodeByName("Empty");

    shadowGenerator.addShadowCaster(assets.mesh);

    this._input = input;
  }

  private _updateFromControls():void{
    // 이동과 회전 기능 

    this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

    // [이동]
    // (1) 이동 입력값 받기
    this._moveDirection = Vector3.Zero();
    this._h = this._input.horizontal; // x-axis
    this._v = this._input.vertical; // z-axis

    if (this._input.dashing && !this._dashPressed && this._canDash && !this._grounded) {
      this._canDash = false; //we've started a dash, do not allow another
      this._dashPressed = true; //start the dash sequence
    }

    let dashFactor = 1;
    //if you're dashing, scale movement
    if (this._dashPressed) {
      if (this.dashTime > Player.DASH_TIME) {
        this.dashTime = 0;
        this._dashPressed = false;
      } else {
        dashFactor = Player.DASH_FACTOR;
      }
      this.dashTime++;
    }    

    // (2) camRoot의 위치값을 이용해 이동 벡터값 도출
    let fwd = this._camRoot.forward;
    let right = this._camRoot.right;
    let correctedVertical = fwd.scaleInPlace(this._v);
    let correctedHorizontal = right.scaleInPlace(this._h);
    let move = correctedHorizontal.addInPlace(correctedVertical);
    let move_normal = move.normalize();

    // (3) Y축을 0으로 지정, X/Z축 내 방향 도출
    //this._moveDirection = new Vector3(move_normal.x, 0, move_normal.z);
    this._moveDirection = new Vector3(move_normal.x * dashFactor, 0, move_normal.z * dashFactor);

    // (4) 키보드 누른 시간 측정을 통해 입력 강도 추출
    let inputMag = Math.abs(this._h) + Math.abs(this._v);
    if(inputMag < 0){
      this._inputAmt = 0;
    } else if(inputMag > 1){
      this._inputAmt = 1;
    } else {
      this._inputAmt = inputMag;
    }

    // (5) 이동속도 추가
    this._moveDirection =  this._moveDirection.scaleInPlace(this._inputAmt * Player.PLAYER_SPEED);

    // [회전]
    // (1) 입력 여부 확인
    let input = new Vector3(this._input.horizontalAxis, 0, this._input.verticalAxis);
    if(input.length() == 0)
    {
      return;
    }

    // (2) 카메라의 현재 각도를 기준으로 이동 각도 계산
    let angle = Math.atan2(input.x, input.z);
    angle += this._camRoot.rotation.y;
    let targ = Quaternion.FromEulerAngles(0,angle,0);
    //const axis = new Vector3(0,1,0);
    //const quaternion = Quaternion.RotationAxis(axis,angle);
  
    // (3) deltaTime을 이용하여 부드럽게 회전
    this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion,targ,this._deltaTime*10);
  }

  private _floorRaycast(offsetX : number, offsetZ : number, raycastlen:number) : Vector3{
    // (1) Ray 구성
    let raycastFloorPos = new Vector3(this.mesh.position.x + offsetX, this.mesh.position.y + 0.5, this.mesh.position.z + offsetZ);
    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    // (2) Ray 충돌 여부 확인
    // let predicate = function(mesh){
    //   return mesh.isPickable && mesh.isEnabled();
    // }
    let pick = this.scene.pickWithRay(ray,(mesh)=>{
      return mesh.isPickable && mesh.isEnabled();
    });

    // (3) ray가 충돌했다면, 결과Point 출력 / 충돌하지 않았다면, (0,0,0) 출력
    if(pick.hit){
      return pick.pickedPoint;
    } else {
      return Vector3.Zero();
    }
  }

  private _isGround():boolean{
    if(this._floorRaycast(0,0,0.6).equals(Vector3.Zero())){
      return false;
    } else{
      return true;
    }
  }

  private _updateGroundDetection(): void {

    // (1) 바닥에 붙어 있는 지 여부 확인 -> 중력 벡터 입력
    if (!this._isGround()) {
      // slope에 있는 지 여부 확인
      if(this._checkSlope() && this._gravity.y <= 0 ){
        //if you are considered on a slope, you're able to jump and gravity wont affect you
        this._gravity.y = 0;
        this._jumpCount = 1;
        this._grounded = true;
      } else {
        this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
        this._grounded = false;
      }
    }
    
    // (2) 중력을 아래로 향하게 방향 수정 → mesh.moveWithCollisions()로 중력 적용 → 이동
    //limit the speed of gravity to the negative of the jump power
    if (this._gravity.y < -Player.JUMP_FORCE) {
      this._gravity.y = -Player.JUMP_FORCE;
    }
    this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));
  
    // (3) 아래 방향으로 이동 후, 바닥에 닿게 되면, 최종 위치를 현재 위치로 업데이트
    if (this._isGround()) {
      this._gravity.y = 0;
      this._grounded = true;
      this._lastGroundPos.copyFrom(this.mesh.position);

      this._jumpCount = 1;
      //dashing reset
      this._canDash = true; //the ability to dash
      //reset sequence(needed if we collide with the ground BEFORE actually completing the dash duration)
      this.dashTime = 0;
      this._dashPressed = false;
    }

    // jump detection
    if(this._input.jumpKeyDown && this._jumpCount > 0){
      this._gravity.y = Player.JUMP_FORCE;
      this._jumpCount--;
    }
  }

 //check stair 전체 코드
  private _checkSlope(): boolean {

    //only check meshes that are pickable and enabled (specific for collision meshes that are invisible)
    let predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled();
    }

    //4 raycasts outward from center
    let raycast = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z + .25);
    let ray = new Ray(raycast, Vector3.Up().scale(-1), 1.5);
    let pick = this.scene.pickWithRay(ray, predicate);

    let raycast2 = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z - .25);
    let ray2 = new Ray(raycast2, Vector3.Up().scale(-1), 1.5);
    let pick2 = this.scene.pickWithRay(ray2, predicate);

    let raycast3 = new Vector3(this.mesh.position.x + .25, this.mesh.position.y + 0.5, this.mesh.position.z);
    let ray3 = new Ray(raycast3, Vector3.Up().scale(-1), 1.5);
    let pick3 = this.scene.pickWithRay(ray3, predicate);

    let raycast4 = new Vector3(this.mesh.position.x - .25, this.mesh.position.y + 0.5, this.mesh.position.z);
    let ray4 = new Ray(raycast4, Vector3.Up().scale(-1), 1.5);
    let pick4 = this.scene.pickWithRay(ray4, predicate);

    if (pick.hit && !pick.getNormal().equals(Vector3.Up())) {
        if(pick.pickedMesh.name.includes("stair")) { 
            return true; 
        }
    } else if (pick2.hit && !pick2.getNormal().equals(Vector3.Up())) {
        if(pick2.pickedMesh.name.includes("stair")) { 
            return true; 
        }
    }
    else if (pick3.hit && !pick3.getNormal().equals(Vector3.Up())) {
        if(pick3.pickedMesh.name.includes("stair")) { 
            return true; 
        }
    }
    else if (pick4.hit && !pick4.getNormal().equals(Vector3.Up())) {
        if(pick4.pickedMesh.name.includes("stair")) { 
            return true; 
        }
    }
    return false;
  }


  public activatePlayerCamera(): UniversalCamera {

    this.scene.registerBeforeRender(()=>{
      this._beforeRenderUpdate();
      this._updateCamera();
    });
    return this.camera;
  }

  private _beforeRenderUpdate() {
    this._updateFromControls();
    //move our mesh
    //this.mesh.moveWithCollisions(this._moveDirection);    
    this._updateGroundDetection();
  }

  private _setupPlayerCamera() : UniversalCamera {
    /* CAD 같은 SW의 경우 Arc 나 Free camera 사용을 권장함
    var camera4 = new ArcRotateCamera("arc", -Math.PI/2, Math.PI/2, 40, new Vector3(0,3,0), this.scene);
    camera4.attachControl(true);
    camera4.lowerRadiusLimit = 5; // 줌인 가능한 최소 거리 설정
    camera4.upperRadiusLimit = 500; // 줌아웃 가능한 최대 거리 설정
    */
    
    // [root]
    // root camera parent that handles positioning of the camera to follow the player
    this._camRoot = new TransformNode('root');
    this._camRoot.position = new Vector3(0,0,0);
    // this._camRoot.rotation = new Vector3(0,Math.PI,0);         // to face the player from behind (180 degrees)

    // [pitch]
    // rotate along the x-axis (up/down tilting)
    let yTilt = new TransformNode('ytilt');
    // adjustments to camera view to point down at our player
    yTilt.rotation = Player.ORIGINAL_TILT;
    yTilt.parent = this._camRoot;
    this._yTilt = yTilt;

    // [actual camera]
    //our actual camera that's pointing at our root's position
    this.camera = new UniversalCamera("cam",new Vector3(0,5,-50),this.scene);//new Vector3(0,0,-30)

    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    this.scene.activeCamera = this.camera;
    return this.camera;
  }

  private _updateCamera(): void {
    let centerPlayer = this.mesh.position.y + 2;
    this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);   
  }
}