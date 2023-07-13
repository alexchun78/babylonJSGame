import { AnimationGroup, Color3, Mesh, MeshBuilder, PBRMetallicRoughnessMaterial, PointLight, Scene, Vector3 } from "@babylonjs/core";

export class Lantern {

  private _scene:Scene;
  private _lightmtl : PBRMetallicRoughnessMaterial;
  private _lightSphere: Mesh;

  public mesh: Mesh;
  public isLit: boolean;

  constructor(lightmtl:PBRMetallicRoughnessMaterial, mesh:Mesh, scene:Scene, position:Vector3, animationGroup?:AnimationGroup){
    this._scene = scene;
    this._lightmtl = lightmtl;  

    //create the lantern's sphere of illumination
    const lightSphere = MeshBuilder.CreateSphere("illum", {segments: 4, diameter:20}, this._scene);
    lightSphere.scaling.y = 2;
    lightSphere.setAbsolutePosition(position);
    lightSphere.parent = this.mesh;
    lightSphere.isVisible = false;
    lightSphere.isPickable = false;
    this._lightSphere = lightSphere;     
    
    //load the lantern mesh
    this._loadLantern(mesh, position);
  }


  private _loadLantern(mesh: Mesh, position: Vector3) {
    this.mesh = mesh;
    this.mesh.scaling = new Vector3(.8, .8, .8);
    this.mesh.setAbsolutePosition(position);
    this.mesh.isPickable = false; 
  }

  public setEmissiveTexture():void{
    this.isLit = true;

    //swap texture
    this.mesh.material = this._lightmtl;

    //create light source for the lanterns
    const light = new PointLight("lantern light", this.mesh.getAbsolutePosition(), this._scene);
    light.intensity = 30;
    light.radius = 2;
    light.diffuse = new Color3(0.45, 0.56, 0.80);
    this._findNearestMeshes(light);
  }

  //when the light is created, only include the meshes that are within the sphere of illumination
  private _findNearestMeshes(light: PointLight): void {
    this._scene.getMeshByName("__root__").getChildMeshes().forEach(m => {
      if (this._lightSphere.intersectsMesh(m)) {
        light.includedOnlyMeshes.push(m);
      }
    });

    //get rid of the sphere
    this._lightSphere.dispose();
  }
}