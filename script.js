(function(global) {
  // animation stuff
  var fps, fpsInterval, startTime, now, then, elapsed;

  // game of life stuff
  var gameOfLife = {
    grid: [],
    oldGrids: [],
    ROWS: 20,
    COLS: 20,
    NUMBER_OF_CELLS: 50,
    NUMBER_OF_LEVELS: 30
  };

  const createBlankGrid = () => {
    let newGrid = [];
  
    for (let y = 0; y < gameOfLife.ROWS; y++) {
      newGrid.push(new Array(gameOfLife.COLS).fill(0));
    }
  
    return newGrid;
  };

  const randRange = (min, max) => { // min and max included 
    return Math.floor(Math.random() * (max - min) + min)
  }

  const initGrid = () => {
    gameOfLife.grid = createBlankGrid();
    for (var i = 0; i < gameOfLife.NUMBER_OF_CELLS; i++) {
      gameOfLife.grid[randRange(0, gameOfLife.COLS)][randRange(0, gameOfLife.ROWS)] = 1;
    }
  };

  const countNeighbors = (x, y) => {
    let neighbors = 0;
  
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx != 0 || dy != 0) {
          let nx = x + dx;
          let ny = y + dy;
          if ((nx >= 0 && nx < gameOfLife.COLS) &&
              (ny >= 0 && ny < gameOfLife.ROWS)) 
            neighbors += gameOfLife.grid[ny][nx];
        }
      }
    }
  
    return neighbors;
  };

  const applyGameOfLifeRules = () => {
    /*
      These simple rules are as follows: 
      1. If the cell is alive, then it stays alive if:
       it has either 2 or 3 live neighbors; 
      2. If the cell is dead, then it springs to life only:
       it has 3 live neighbors.
    */
    let newGrid = createBlankGrid();
  
    for (let y = 0; y < gameOfLife.ROWS; y++) {
      for (let x = 0; x < gameOfLife.COLS; x++) {
        let neighbors = countNeighbors(x, y);
        if (gameOfLife.grid[y][x] === 1) { // if the cell is live => rule #1
          if (neighbors === 2 || neighbors === 3) {
            newGrid[y][x] = 1;
          } else {
            newGrid[y][x] = 0;
          }
        } else { // if the cell is dead => rule #2
          if (neighbors === 3) {
            newGrid[y][x] = 1;
          }
        }
      }
    }

    // counting live cells
    let liveCells = 0;
    for (let y = 0; y < gameOfLife.ROWS; y++) {
      for (let x = 0; x < gameOfLife.COLS; x++) {
        if(newGrid[y][x] === 1) liveCells++;
      }
    }

    // if there are few cells, create some random 
    if (liveCells < gameOfLife.NUMBER_OF_CELLS / 2) {
      let delta = gameOfLife.NUMBER_OF_CELLS / 2 - liveCells;
      for (var i = 0; i < delta; i++) {
        newGrid[randRange(0, gameOfLife.COLS)][randRange(0, gameOfLife.ROWS)] = 1;
      }
    }
  
    gameOfLife.oldGrids.push(gameOfLife.grid);
    if (gameOfLife.oldGrids.length > gameOfLife.NUMBER_OF_LEVELS) {
      gameOfLife.oldGrids.shift();
    }
    gameOfLife.grid = newGrid;
  };

  /*
  * Constants and Main
  * www.programmingtil.com
  * www.codenameparkerllc.com
  */
  var state = {
    gl: null,
    program: 'render',
    ui: {
      dragging: false,
      mouse: {
        lastX: -1,
        lastY: -1,
      },
      pressedKeys: {},
    },
    animation: {},
    app: {
      doAnimate: true,
      eye: {
        x:27,
        y:23,
        z:6.,
      },
      objects: [],
    },
  };

  // Create a cube
  function Cube(opts) {
    var opts = opts || {};
    this.id = uuid();
    this.opts = opts;
     // v0-v1-v2-v3 front
     // v0-v3-v4-v5 right
     // v0-v5-v6-v1 up
     // v1-v6-v7-v2 left
     // v7-v4-v3-v2 down
     // v4-v7-v6-v5 back
    this.attributes = {
      aColor: {
        size:3,
        offset:0,
        bufferData: new Float32Array([
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
          1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1　
        ]),
      },
      aNormal: {
        size:3,
        offset:0,
        bufferData: new Float32Array([
          0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
          1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
          0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
         -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,
          0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,
          0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0
        ]),
      },
      aPosition: {
        size:3,
        offset:0,
        bufferData: new Float32Array([
          1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,
          1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,
          1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,
         -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,
         -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,
          1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0
       ]),
     },
    };
    this.indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,
      4, 5, 6,   4, 6, 7,
      8, 9,10,   8,10,11,
      12,13,14,  12,14,15,
      16,17,18,  16,18,19,
      20,21,22,  20,22,23
    ]);
    this.state = {
      angle: opts.angle ? opts.angle : [0,0,0],
      mm: mat4.create(),
      nm: null,
    };
    this.selColor = opts.selColor ? opts.selColor : [0,0,0,0];
    this.stride = opts.stride ? opts.stride : 0;

    // Functionality
    this.readState = function() {
      this.attributes.aColorBackup = this.attributes.aColor;
      this.attributes.aColor = this.attributes.aSelColor;
    };
    this.drawState = function() {
      this.attributes.aColor = this.attributes.aColorBackup;
    };

    this.draw = function() {
      var uMVPMatrix = state.gl.getUniformLocation(state.programs[state.program], 'uMVPMatrix');
      var uModelMatrix = state.gl.getUniformLocation(state.programs[state.program], 'uModelMatrix');
      var uNormalMatrix = state.gl.getUniformLocation(state.programs[state.program], 'uNormalMatrix');
      var mvp = state.mvp;
      state.programs[state.program].renderBuffers(this);
      var n = this.indices.length;
      var mm = mat4.create();
      if (this.opts.translate) {
        mat4.translate(mm, mm, this.opts.translate);
      }
      if (this.opts.scale) {
        mat4.scale(mm, mm, this.opts.scale);
      }
      if (this.state.angle[0] || this.state.angle[1] || this.state.angle[2]) {
        mat4.rotateX(mm, mm, this.state.angle[0]);
        mat4.rotateY(mm, mm, this.state.angle[1]);
        mat4.rotateZ(mm, mm, this.state.angle[2]);
      }
      state.gl.uniformMatrix4fv(uModelMatrix, false, mm);

      mat4.copy(mvp, state.pm);
      mat4.multiply(mvp, mvp, state.vm);
      mat4.multiply(mvp, mvp, mm);
      state.gl.uniformMatrix4fv(uMVPMatrix, false, mvp);

      // Lighting
      if (state.program === 'render') {
        state.gl.uniform3f(state.uDiffuseLight, 1.0, 1.0, 1.0);
        state.gl.uniform3f(state.uAmbientLight, 0.2, 0.2, 0.2);
        // Set the light direction (in the world coordinate)
        state.gl.uniform3f(state.uLightPosition, 1.0, 2.0, 1.7);

        // Normalized invert
        var nm = mat3.normalFromMat4(mat3.create(), mm);
        state.gl.uniformMatrix3fv(uNormalMatrix, false, nm);
      }
      state.gl.drawElements(state.gl.TRIANGLES, n, state.gl.UNSIGNED_BYTE, 0);
    };

    // Initialization
    this.init = function(_this) {
      _this.selColor = _this.selColor.map(function(n) { return n/255; });
      var arrays = [
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
      ];
      _this.attributes.aSelColor = {
        size:4,
        offset:0,
        bufferData: new Float32Array(
          [].concat.apply([], arrays)
        ),
      };
    }(this);
  };

  glUtils.SL.init({ callback:function() { main(); } });

  function main() {
    state.canvas = document.getElementById("glcanvas");
    state.gl = glUtils.checkWebGL(state.canvas, { preserveDrawingBuffer: true });
    initCallbacks();
    initShaders();
    initGL();
    initState();
    draw();
    if (state.app.doAnimate) {
      animate(24);
    }
  }

  function initCallbacks() {
  }

  function initShaders() {
    var vertexShader  = glUtils.getShader(state.gl, state.gl.VERTEX_SHADER,   glUtils.SL.Shaders.v1.vertex),
      vertexShader2   = glUtils.getShader(state.gl, state.gl.VERTEX_SHADER,   glUtils.SL.Shaders.v2.vertex),
      fragmentShader  = glUtils.getShader(state.gl, state.gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v1.fragment),
      fragmentShader2 = glUtils.getShader(state.gl, state.gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v2.fragment);
    state.programs = {
      render: glUtils.createProgram(state.gl, vertexShader, fragmentShader),
      read:   glUtils.createProgram(state.gl, vertexShader2, fragmentShader2),
    };
  }

  function initGL() {
    state.gl.clearColor(0,0,0,1);
    state.gl.enable(state.gl.DEPTH_TEST);
    state.gl.useProgram(state.programs[state.program]);
  }


  function initState() {
    state.uAmbientLight = state.gl.getUniformLocation(state.programs[state.program], 'uAmbientLight');
    state.uDiffuseLight = state.gl.getUniformLocation(state.programs[state.program], 'uDiffuseLight');
    state.uLightPosition = state.gl.getUniformLocation(state.programs[state.program], 'uLightPosition');
    state.vm = mat4.create();
    state.pm = mat4.create();
    state.mvp = mat4.create();
    state.app.objects = [];

    initGrid();
  }

  function animate(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    state.animation.tick = function() {
      now = Date.now();
      elapsed = now - then;

      if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);    
        draw();
      }

      requestAnimationFrame(state.animation.tick);
    };
    state.animation.tick();
  }

  function drawGrid(grid, level) {
    for (let col = 0; col < gameOfLife.COLS; col++) {
      for (let row = 0; row < gameOfLife.ROWS; row++) {
        if (grid[col][row] === 1) {
          let x = row - gameOfLife.ROWS / 2;
          let y = col - gameOfLife.COLS / 2;
          state.app.objects.push(new Cube({scale:[0.4,0.4,0.4], translate:[x, 10 - level, y]}));
        }
      }
    }
  }

  function draw(args) {
    state.gl.clear(state.gl.COLOR_BUFFER_BIT | state.gl.DEPTH_BUFFER_BIT);
    mat4.perspective(state.pm,
      20, state.canvas.width/state.canvas.height, 1, 100
    );
    mat4.lookAt(state.vm,
      vec3.fromValues(state.app.eye.x,state.app.eye.y,state.app.eye.z),
      vec3.fromValues(0,0,0),
      vec3.fromValues(0,1,0)
    );

    // cleaning the objects array
    state.app.objects = [];

    // drawing the cubes based of the grid
    drawGrid(gameOfLife.grid, 0);
    for (let level = 1; level <= gameOfLife.oldGrids.length; level++) {
      drawGrid(gameOfLife.oldGrids[gameOfLife.oldGrids.length - level], level);
    }
    // calculate the next grid
    applyGameOfLifeRules();

    // Loop through each object and draw!
    state.app.objects.forEach(function(obj) {
      obj.draw();
    });
  }

  /*
  * Utility
  * www.programmingtil.com
  * www.codenameparkerllc.com
  */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
})(window || this);