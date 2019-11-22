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
    CABLES.patch.setVariable('current_image', target.detail);
  }

  function hideTarget(detail) {
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



