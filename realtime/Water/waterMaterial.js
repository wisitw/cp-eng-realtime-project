(function () {
    WaterMaterial = function (name, scene, light) {
        this.name = name;
        this.id = name;
        this.light = light;

        this._scene = scene;
        scene.materials.push(this);

        this.bumpTexture = new BABYLON.Texture("Water/bump.png", scene);
        this.bumpTexture.uScale = 2;
        this.bumpTexture.vScale = 2;
        this.bumpTexture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
        this.bumpTexture.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

        this.reflectionTexture = new BABYLON.MirrorTexture("reflection", 512, scene, true);
        this.refractionTexture = new BABYLON.RenderTargetTexture("refraction", 512, scene, true);        
        this.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);

        this.refractionTexture.onBeforeRender = function() {
            BABYLON.clipPlane = new BABYLON.Plane(0, 1, 0, 0);
        };

        this.refractionTexture.onAfterRender = function() {
            BABYLON.clipPlane = null;
        };

        this.waterColor = new BABYLON.Color4(0.3, 1.0, 1.0,1);
        this.waterColorLevel = 0.2;
        this.fresnelLevel = 16.0;
        this.reflectionLevel = 0.6;
        this.refractionLevel = 15.0;
        
        this.waveLength = 0.5;
        this.waveHeight = 0.15;

        this.waterDirection = new BABYLON.Vector2(0, 1.0);

        this._time = 0;
    };

    WaterMaterial.prototype = Object.create(BABYLON.Material.prototype);

    // Properties   
    WaterMaterial.prototype.needAlphaBlending = function () {
        return false;
    };

    WaterMaterial.prototype.needAlphaTesting = function () {
        return false;
    };

    // Methods   
    WaterMaterial.prototype.getRenderTargetTextures = function () {
        var results = [];

        results.push(this.reflectionTexture);
        results.push(this.refractionTexture);
		 results.push(this.reflectionTexture);
		  results.push(this.reflectionTexture);
        return results;
    };

    WaterMaterial.prototype.isReady = function (mesh) {
        var engine = this._scene.getEngine();
        
        if (this.bumpTexture && !this.bumpTexture.isReady) {
            return false;
        }

        this._effect = engine.createEffect("Water/water",
            ["position", "normal", "uv"],
            ["worldViewProjection", "world", "view", "vLightPosition", "vEyePosition", "waterColor", "vLevels", "waveData", "windMatrix"],
            ["reflectionSampler", "refractionSampler", "bumpSampler"],
            "");

        if (!this._effect.isReady()) {
            return false;
        }

        return true;
    };

    WaterMaterial.prototype.bind = function (world, mesh) {
        this._time += 0.01 * this._scene.getAnimationRatio();

        this._effect.setMatrix("world", world);
        this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
        this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
        this._effect.setVector3("vLightPosition", this.light.position);
        this._effect.setColor3("waterColor", this.waterColor);
        this._effect.setFloat4("vLevels", this.waterColorLevel, this.fresnelLevel, this.reflectionLevel, this.refractionLevel);
        this._effect.setFloat2("waveData", this.waveLength, this.waveHeight);

        // Textures        
        this._effect.setMatrix("windMatrix", this.bumpTexture.getTextureMatrix().multiply(BABYLON.Matrix.Translation(this.waterDirection.x * this._time, this.waterDirection.y * this._time, 0)));
        this._effect.setTexture("bumpSampler", this.bumpTexture);
        this._effect.setTexture("reflectionSampler", this.reflectionTexture);
        this._effect.setTexture("refractionSampler", this.refractionTexture);
    };

    WaterMaterial.prototype.dispose = function () {
        if (this.bumpTexture) {
            this.bumpTexture.dispose();
        }
        
        if (this.groundTexture) {
            this.groundTexture.dispose();
        }

        if (this.snowTexture) {
            this.snowTexture.dispose();
        }
        this.baseDispose();
    };
})();