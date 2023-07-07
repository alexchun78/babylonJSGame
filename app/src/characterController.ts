import { ArcRotateCamera, Mesh, Scene, ShadowGenerator, TransformNode, UniversalCamera, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode  {

    public camera;
    public scene : Scene;  
    // Player 
    public mesh : Mesh;

    private _camRoot : TransformNode;
    private _yTilt : TransformNode;
    private _input;

    // static
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);

    constructor(assets, scene:Scene, shadowGenerator:ShadowGenerator,input?){
        super("Player", scene);

        this.scene = scene;
        this._setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;

        shadowGenerator.addShadowCaster(assets.mesh);

        this._input = input;
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
        // to face the player from behine (180 degrees)
      //  this._camRoot.rotation = new Vector3(0,Math.PI,0);

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