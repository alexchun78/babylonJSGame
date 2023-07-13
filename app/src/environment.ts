import { ActionManager, Color3, ExecuteCodeAction, Mesh, MeshBuilder, PBRMetallicRoughnessMaterial, Scene, SceneLoader, Texture, TransformNode, Vector3 } from "@babylonjs/core";
import { Lantern } from "./lantern";
import { Player } from "./characterController";

export class Environment {
  private _scene : Scene;
  private _lightmtl: PBRMetallicRoughnessMaterial;
  private _lanternObjs: Array<Lantern>;
  
  constructor(scene:Scene){
    this._scene = scene;
    this._lanternObjs = [];

    //create emissive material for when lantern is lit
    const lightmtl = new PBRMetallicRoughnessMaterial("lantern mesh light", this._scene);
    lightmtl.emissiveTexture = new Texture("/textures/litLantern.png", this._scene, true, false);
    lightmtl.emissiveColor = new Color3(0.8784313725490196, 0.7568627450980392, 0.6235294117647059);
    this._lightmtl = lightmtl;
  }

  public async load(){
    //var ground = Mesh.CreateBox("ground", 24, this._scene);
    // let ground = MeshBuilder.CreateBox("ground", {size:24},this._scene);
    // ground.scaling = new Vector3(1,.02,1);

    const assets = await this._loadAsset();
    //Loop through all environment meshes that were imported
    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;

      if (m.name == "ground") {
        //dont check for collisions, dont allow for raycasting to detect it(cant land on it)
        m.checkCollisions = false;
        m.isPickable = false;
      }
      //areas that will use box collisions
      if (m.name.includes("stairs") || m.name == "cityentranceground" || m.name == "fishingground.001" || m.name.includes("lilyflwr")) {
        m.checkCollisions = false;
        m.isPickable = false;
      }
      //collision meshes
      if (m.name.includes("collision")) {
        m.isVisible = false;
        m.isPickable = true;
      }
      //trigger meshes
      if (m.name.includes("Trigger")) {
        m.isVisible = false;
        m.isPickable = false;
        m.checkCollisions = false;
      }    
    });

    // 랜턴
    assets.lantern.isVisible = false;
    // 모든 랜턴을 담을 transformNode  설정
    const lanternHolder = new TransformNode("lanternHolder", this._scene);
    for(let i = 0; i <22; ++i){
      //mesh 복제
      let lanternInstance = assets.lantern.clone('lantern'+i);
      lanternInstance.isVisible = true;
      lanternInstance.setParent(lanternHolder);

      // 랜턴 오브젝트 생성
      let newLantern = new Lantern(this._lightmtl, lanternInstance, this._scene, assets.env.getChildTransformNodes(false).find(m => m.name === "lantern " + i).getAbsolutePosition());
      this._lanternObjs.push(newLantern);
    }
    assets.lantern.dispose();
  }

  private async _loadAsset(){

    // 환경
    const result = await SceneLoader.ImportMeshAsync(null,"./models/","envSetting.glb",this._scene);
    let env = result.meshes[0];
    let allMeshes = env.getChildMeshes();

    // 랜턴
    const res = await SceneLoader.ImportMeshAsync("", "./models/", "lantern.glb", this._scene);
    let lantern = res.meshes[0].getChildren()[0];
    lantern.parent = null;
    res.meshes[0].dispose();

    return {
      env: env, //reference to our entire imported glb (meshes and transform nodes)
      allMeshes: allMeshes, // all of the meshes that are in the environment

      lantern: lantern as Mesh,
    };
  }

  public checkLanterns(player: Player){
    if (!this._lanternObjs[0].isLit) {
      this._lanternObjs[0].setEmissiveTexture();
    }

    this._lanternObjs.forEach(lantern => {
	    player.mesh.actionManager.registerAction(
        new ExecuteCodeAction(
          {
              trigger: ActionManager.OnIntersectionEnterTrigger,
              parameter: lantern.mesh
          },
          () => {
            //if the lantern is not lit, light it up & reset sparkler timer
            if (!lantern.isLit && player.sparkLit) {
              player.lanternsLit += 1; //increment the lantern count
              lantern.setEmissiveTexture(); //"light up" the lantern
              //reset the sparkler
              player.sparkReset = true;
              player.sparkLit = true;
            }
            //if the lantern is lit already, reset the sparkler
            else if (lantern.isLit) {
              player.sparkReset = true;
              player.sparkLit = true;
            }
          }
        )
	    );
	  });
  }

}