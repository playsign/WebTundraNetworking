var PhysicsApplication = ICameraApplication.$extend(
{
    __init__ : function()
    {
        this.$super("Physics");

        // Enables animations if both the previous and this camera entity is unparented
        this.animateBeforeActivation(true);

        TundraSDK.framework.client.onConnected(this, this.onConnected);
        TundraSDK.framework.client.onDisconnected(this, this.onDisconnected);
        
        this.entities = {};
        this.createScene();
    },

    onConnected : function()
    {
        this.createCamera();
    },

    createCamera : function()
    {
        this.onDisconnected();

        this.movement = new THREE.Vector3(0,0,0);
        this.movementForce = 10.0;

        // Connect input
        this.subscribeEvent(TundraSDK.framework.input.onMouseMove(this, this.onMouseMove));
        this.subscribeEvent(TundraSDK.framework.input.onKeyEvent(this, this.onKeyEvent));

        // Connect frame update
        this.subscribeEvent(TundraSDK.framework.frame.onUpdate(this, this.onUpdate));

        // Start up the ICameraApplication
        this.startCameraApplication("Free Look", "FreeLookCamera", 60);

        // Initiate camera pos/rot and activate it
        var t = this.cameraEntity.placeable.transform;
        t.pos.y = 2;
        t.pos.z = 3;
        this.cameraEntity.placeable.transform = t;
        this.cameraEntity.camera.setActive();
    },
    
    createScene : function()
    {
        var meshEntity = null;
        this.entities["Deer"] = this.createMesh("Deer", "webtundra://Box.json");
        
        meshEntity = this.entities["Deer"];
        //meshEntity.mesh.materialRefs = ["tundra://cube.material"];
        //var materials = 
        //console.log(meshEntity.mesh.materialRefs);
        var t = meshEntity.placeable.transform;
        t.pos.y = 2;
        t.pos.z = -5;
        meshEntity.placeable.transform = t;
        
        this.entities["Plane"] = this.createMesh("Plane", "webtundra://Plane.json");
        meshEntity = this.entities["Plane"];
        var t = meshEntity.placeable.transform;
        t.pos.y = 0;
        t.pos.z = -5;
        meshEntity.placeable.transform = t;
        
        console.log("CreateScene");
        console.log(this.entities["Deer"]);
    },
    
    createMesh : function(name, ref)
    {
        var meshEntity = this.cameraEntity = TundraSDK.framework.scene.createLocalEntity(["Name", "Placeable", "Mesh", "RigidBody"]);
        meshEntity.name = name;
        meshEntity.mesh.meshRef = ref;
        meshEntity.rigidbody.mass = 1.0;
        console.log(meshEntity.rigidbody)
        
        return meshEntity;
    },
    
    /*requestSceneAsset : function(url, id)
    {
        // Passing in metadata for the callback.
        var transfer = TundraSDK.framework.asset.requestAsset(url);
        if (transfer != null)
        {
            transfer.onCompleted(this.assets, this.onAssetCompleted, id)
            transfer.onFailed(this.assets, this.onAssetFailed, id)
        }
        // Forcing an asset type for a request.
        transfer = TundraSDK.framework.asset.requestAsset("http://www.my-assets.com/data/my.json", "Text");
        if (transfer != null)
        {
            transfer.onCompleted(myContext, function(asset) {
                this.textAsset = asset;              // this === the given context, in this case 'myContext'
                console.log(JSON.parse(asset.data)); // "Text" forced TextAsset type
            });
            transfer.onFailed(myContext, function(transfer, reason, metadata) {
                console.log("Failed to fetch my json from", transfer.ref, "into", this.name); // this.name === "MyContextObject"
                console.log("Reason:", + reason);
                console.log("Metadata id:", metadata); // metadata === 12345
            }, 12345);
        }
    },
    
    onAssetCompleted : function(asset, metadata)
    {
        this.meshAsset = asset;
        console.log("Mesh loaded:", asset.name);
        console.log("My metadata: ", metadata);
    },
    
    onAssetFailed : function(transfer, reason, metadata)
    {
        console.log("Failed to fetch my json from", transfer.ref, "into", this.name); // this.name === "MyContextObject"
        console.log("Reason:", + reason);
        console.log("Metadata id:", metadata); // metadata === 12345
    },*/

    onDisconnected : function()
    {
        this.resetCameraApplication();
        this.unsubscribeEvents();
    },

    onCameraActived : function(cameraEntity, previousCameraEntity)
    {
        this.movement.x = 0; this.movement.y = 0; this.movement.z = 0;
    },

    onCameraDeactived : function(cameraEntity, activatedCameraEntity)
    {
        this.movement.x = 0; this.movement.y = 0; this.movement.z = 0;
    },

    onUpdate : function(frametime)
    {
        if (!this.cameraEntity.camera.active)
            return;

        if (this.movement.x != 0 || this.movement.y != 0 || this.movement.z != 0)
        {
            var t = this.cameraEntity.placeable.transform;
            var relativeMovement = this.movement.clone();
            relativeMovement.applyQuaternion(t.orientation());
            relativeMovement.multiplyScalar(frametime * this.movementForce)
            t.pos.x += relativeMovement.x;
            t.pos.y += relativeMovement.y;
            t.pos.z += relativeMovement.z;
            this.cameraEntity.placeable.transform = t;
        }
    },

    onKeyEvent : function(event)
    {
        if (!this.cameraEntity.camera.active)
            return;

        if (event.type === "release")
        {
            if (event.key == "w" || event.key == "up" || event.key == "s" ||  event.key == "down")
                this.movement.z = 0;
            else if (event.key == "a" || event.key == "d" || event.key == "left" || event.key == "right")
                this.movement.x = 0;
            else if (event.key == "c" || event.key == "space")
                this.movement.y = 0;
        }

        if (event.targetNodeName !== "body")
        {
            this.movement.x = 0; this.movement.y = 0; this.movement.z = 0;
            return;
        }

        var speed = 1;
        if (event.pressed["shift"])
            speed *= 2;

        this.movement.x = 0; this.movement.y = 0; this.movement.z = 0;
        for (var key in event.pressed)
        {
            if (key == "w" || key == "up")
                this.movement.z = -speed;
            else if (key == "s" || key == "down")
                this.movement.z = speed;
            else if (key == "a" || key == "left")
                this.movement.x = -speed;
            else if (key == "d" || key == "right")
                this.movement.x = speed;
            else if (key == "c")
                this.movement.y = -speed;
            else if (key == "space")
                this.movement.y = speed;
        }
    },

    onMouseMove : function(event)
    {
        if (!this.cameraEntity.camera.active)
            return;

        if (!event.rightDown)
            return;
        if (event.targetNodeName !== "canvas")
            return;
        if (event.relativeX == 0 && event.relativeY == 0)
            return;

        if (event.relativeX != 0 || event.relativeY != 0)
        {
            var t = this.cameraEntity.placeable.transform;
            if (event.relativeX != 0)
            {
                t.rot.y -= (event.relativeX * 0.2);
                if (t.rot.y > 360.0 || t.rot.y < -360.0)
                    t.rot.y = t.rot.y % 360.0;
            }
            if (event.relativeY != 0)
            {
                t.rot.x -= (event.relativeY * 0.2);
                if (t.rot.x > 90.0)
                    t.rot.x = 90.0;
                else if (t.rot.x < -90.0)
                    t.rot.x = -90.0;
            }
            this.cameraEntity.placeable.transform = t;
        }
    }
});
