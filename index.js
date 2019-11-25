const recognizedTargets = {};

const customPipelineModule = () => {

  return {
    name: 'customwhatever',
    onStart: ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
      console.log('start custom...');
    },
    onUpdate: ({ processCpuResult }) => {

      if (!processCpuResult.reality) {
        // console.log("no reality");
        return;
      }

      // console.log(processCpuResult.reality);
      const { rotation, position, intrinsics } = processCpuResult.reality;

      if (intrinsics) CABLES.patch.setVariable('projm', intrinsics);

      if (position && rotation) {
        const vmat = mat4.create();

        var mul = 3.0;
        var qinv = quat.create();
        var q = quat.create();
        var pos = vec3.create();
        var posi = vec3.create();

        vec3.set(pos, position.x * mul, position.y * mul, position.z * mul);
        vec3.set(posi, 0 - position.x * mul, 0 - position.y * mul, 0 - position.z * mul);


        quat.set(q, rotation.x, rotation.y, rotation.z, rotation.w);
        quat.invert(qinv, q);

        var mq = mat4.create();
        mat4.fromQuat(mq, qinv);

        mat4.translate(vmat, vmat, posi);
        mat4.mul(vmat, mq, vmat);

        CABLES.patch.setVariable('vmatrix', vmat);
      }


    },
    onCanvasSizeChange: ({ canvasWidth, canvasHeight }) => {
      // const {renderer} = scene3
      // renderer.setSize(canvasWidth, canvasHeight)
    },
    onRender: () => {
      // const {scene, renderer, camera} = scene3
      // renderer.clearDepth()
      // renderer.render(scene, camera)
    },
    // Get a handle to the xr scene, camera and renderer. Returns:
    // {
    //   scene: The Threejs scene.
    //   camera: The Threejs main camera.
    //   renderer: The Threejs renderer.
    // }
    xrScene: () => {
      // return scene3
    }
  };
};

const imageTargetPipelineModule = () => {

  function showTarget(target) {
    if(recognizedTargets.hasOwnProperty(target.name)) {
      recognizedTargets[target.detail.name].visible = true;
    }else{
      target.detail.visible = true;
      recognizedTargets[target.detail.name] = target.detail;
    }
    const keys = Object.keys(recognizedTargets);
    const targets = [];
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      targets.push(recognizedTargets[key]);
    }
    CABLES.patch.setVariable('all_images', targets);
    CABLES.patch.setVariable('current_image', target.detail);
  }

  function hideTarget(target) {
    if(recognizedTargets.hasOwnProperty(target.name)) {
      recognizedTargets[target.detail.name].visible = false;
    }else{
      target.detail.visible = false;
      recognizedTargets[target.detail.name] = target.detail;
    }
    const keys = Object.keys(recognizedTargets);
    const targets = [];
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      targets.push(recognizedTargets[key]);
    }
    CABLES.patch.setVariable('all_images', targets);
    CABLES.patch.setVariable('current_image', {});
  }

  return {
    name: 'testproject-target',
    listeners: [
      { event: 'reality.imagefound', process: showTarget },
      { event: 'reality.imageupdated', process: showTarget },
      { event: 'reality.imagelost', process: hideTarget }
    ]
  };
};

const onxrloaded = () => {

  const myModule = customPipelineModule();

  const targets = [
    'IMG_20191125_094404384',
    'IMG_20191125_094404384-1',
    'Texture1_Tracking',
    'erich',
    'evoke',
    '015_Südstadtkunst3_Kölors-e1509014272357',
    '39958946_2084701515180778_8060234493859075130_n',
    'Skelett-Der-kölsche-Liebhaber-e1508945670562',
    'bf7tS',
    'IMG_20191125_094411850'
  ];
  XR8.XrController.configure({disableWorldTracking: true, imageTargets: targets});

  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    myModule,
    XR8.XrController.pipelineModule(),            // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    // nextbuttonPipelineModule(),             // Cycles through shaders and keeps UI up to date.
    imageTargetPipelineModule()
  ]);

  // Request camera permissions and run the camera.
  XR8.run({ canvas: document.getElementById('camerafeed') });
};


// Show loading screen before the full XR library has been loaded.
const load = () => {
  XRExtras.Loading.showLoading({ onxrloaded });
};
window.onload = () => {
  window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load);
};



