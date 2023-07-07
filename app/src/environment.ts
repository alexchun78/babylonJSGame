import { Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";

export class Environment {
    private _scene : Scene;
    
    constructor(scene:Scene){
        this._scene = scene;
    }

    public async _load(){
        //var ground = Mesh.CreateBox("ground", 24, this._scene);
        let ground = MeshBuilder.CreateBox("ground", {size:24},this._scene);
        ground.scaling = new Vector3(1,.02,1);
    }
}