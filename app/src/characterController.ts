import { ArcRotateCamera, Mesh, Scene, ShadowGenerator, TransformNode, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode  {

    public camera;
    public scene : Scene;
    private _input;
    
    // Player 
    public mesh : Mesh;

    constructor(assets, scene:Scene, shadowGenerator:ShadowGenerator,input?){
        super("Player", scene);

        this.scene = scene;
        this._setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;

        shadowGenerator.addShadowCaster(assets.mesh);

        this._input = input;
    }
    private _setupPlayerCamera() {
        var camera4 = new ArcRotateCamera("arc", -Math.PI/2, Math.PI/2, 40, new Vector3(0,3,0), this.scene);
    }
}