// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var $ = require('jquery');
var _ = require('underscore');
var glMatrix = require('webgl2_utils/gl-matrix');
var utils = require('webgl2_utils/utils');
var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');


VVVV.Types.Scene = function(data) {
  this.data = data;
  }

VVVV.PinTypes.Scene = {
  typeName: "Scene",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "No Scene"
  }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: WebGL2Test (react)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


    VVVV.Nodes.WebGL2Test = function(id, graph) {
        this.constructor(id, "WebGL2Test (WebGL2Test)", graph);

        this.meta = {
          authors: ['David Gann'],
          original_authors: [],
          credits: [],
          compatibility_issues: []
        };

        this.auto_evaluate = true;


        var InputPin1 = this.addInputPin('Input', [ 0 ], VVVV.PinTypes.Value);
        var OutputPin1 = this.addOutputPin('Output', [ 0 ], VVVV.PinTypes.Value);


          this.evaluate = function()
          {

            var input = InputPin1.getValue(0);

            OutputPin1.setValue(input, 0);




            var canvas = document.getElementById("gl-canvas");
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    var gl = canvas.getContext("webgl2");
                    if (!gl) {
                        console.error("WebGL 2 not available");
                        document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
                    }
                    gl.clearColor(0.0, 0.0, 0.0, 1.0);
                    gl.enable(gl.BLEND);
                    gl.depthMask(false);
                    if (!gl.getExtension("EXT_color_buffer_float")) {
                        console.error("FLOAT color buffer not available");
                        document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
                    }
                    /////////////////////////
                    // OBJECT DESCRIPTIONS
                    /////////////////////////
                    var NUM_SPHERES = 32;
                    var NUM_PER_ROW = 8;
                    var RADIUS = 0.6;
                    var spheres = new Array(NUM_SPHERES);
                    var colorData = new Float32Array(NUM_SPHERES * 4);
                    var modelMatrixData = new Float32Array(NUM_SPHERES * 16);
                    for (var i = 0; i < NUM_SPHERES; ++i) {
                        var angle = 2 * Math.PI * (i % NUM_PER_ROW) / NUM_PER_ROW;
                        var x = Math.sin(angle) * RADIUS;
                        var y = Math.floor(i / NUM_PER_ROW) / (NUM_PER_ROW / 4) - 0.75;
                        var z = Math.cos(angle) * RADIUS;
                        spheres[i] = {
                            scale: [0.8, 0.8, 0.8],
                            rotate: [0, 0, 0], // Will be used for global rotation
                            translate: [x, y, z],
                            modelMatrix: mat4.create()
                        };
                        colorData.set(glMatrix.vec4.fromValues(
                            Math.sqrt(Math.random()),
                            Math.sqrt(Math.random()),
                            Math.sqrt(Math.random()),
                            0.5
                        ), i * 4);
                    }
                    /////////////////////////
                    // ACCUMULATION PROGRAM
                    /////////////////////////
                    var accumVsSource =  document.getElementById("vertex-accum").text.trim();
                    var accumFsSource =  document.getElementById("fragment-accum").text.trim();

                    var accumVertexShader = gl.createShader(gl.VERTEX_SHADER);
                    gl.shaderSource(accumVertexShader, accumVsSource);
                    gl.compileShader(accumVertexShader);
                    if (!gl.getShaderParameter(accumVertexShader, gl.COMPILE_STATUS)) {
                        console.error(gl.getShaderInfoLog(accumVertexShader));
                    }
                    var accumFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                    gl.shaderSource(accumFragmentShader, accumFsSource);
                    gl.compileShader(accumFragmentShader);
                    if (!gl.getShaderParameter(accumFragmentShader, gl.COMPILE_STATUS)) {
                        console.error(gl.getShaderInfoLog(accumFragmentShader));
                    }
                    var accumProgram = gl.createProgram();
                    gl.attachShader(accumProgram, accumVertexShader);
                    gl.attachShader(accumProgram, accumFragmentShader);
                    gl.linkProgram(accumProgram);
                    if (!gl.getProgramParameter(accumProgram, gl.LINK_STATUS)) {
                        console.error(gl.getProgramInfoLog(accumProgram));
                    }
                    /////////////////////
                    // DRAW PROGRAM
                    /////////////////////
                    var quadVsSource =  document.getElementById("vertex-quad").text.trim();
                    var drawFsSource = document.getElementById("fragment-draw").text.trim();
                    var drawVertexShader = gl.createShader(gl.VERTEX_SHADER);
                    gl.shaderSource(drawVertexShader, quadVsSource);
                    gl.compileShader(drawVertexShader);
                    if (!gl.getShaderParameter(drawVertexShader, gl.COMPILE_STATUS)) {
                        console.error(gl.getShaderInfoLog(drawVertexShader));
                    }
                    var drawFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                    gl.shaderSource(drawFragmentShader, drawFsSource);
                    gl.compileShader(drawFragmentShader);
                    if (!gl.getShaderParameter(drawFragmentShader, gl.COMPILE_STATUS)) {
                        console.error(gl.getShaderInfoLog(drawFragmentShader));
                    }
                    var drawProgram = gl.createProgram();
                    gl.attachShader(drawProgram, drawVertexShader);
                    gl.attachShader(drawProgram, drawFragmentShader);
                    gl.linkProgram(drawProgram);
                    if (!gl.getProgramParameter(drawProgram, gl.LINK_STATUS)) {
                        console.error(gl.getProgramInfoLog(drawProgram));
                    }
                    /////////////////////////
                    // GET UNIFORM LOCATIONS
                    /////////////////////////
                    var sceneUniformsLocation = gl.getUniformBlockIndex(accumProgram, "SceneUniforms");
                    gl.uniformBlockBinding(accumProgram, sceneUniformsLocation, 0);
                    var modelMatrixLocation = gl.getUniformLocation(accumProgram, "uModel");
                    var textureLocation = gl.getUniformLocation(accumProgram, "uTexture");
                    var accumLocation = gl.getUniformLocation(drawProgram, "uAccumulate");
                    var accumAlphaLocation = gl.getUniformLocation(drawProgram, "uAccumulateAlpha");
                    ////////////////////////////////
                    //  SET UP FRAMEBUFFERS
                    ////////////////////////////////
                    var accumBuffer = gl.createFramebuffer();
                    gl.bindFramebuffer(gl.FRAMEBUFFER, accumBuffer);
                    gl.activeTexture(gl.TEXTURE0);
                    var accumTarget = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, accumTarget);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, accumTarget, 0);
                    var accumAlphaTarget = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, accumAlphaTarget);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, accumAlphaTarget, 0);
                    var depthTarget = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, depthTarget);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT16, gl.drawingBufferWidth, gl.drawingBufferHeight);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);
                     gl.drawBuffers([
                        gl.COLOR_ATTACHMENT0,
                        gl.COLOR_ATTACHMENT1
                    ]);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    /////////////////////
                    // SET UP GEOMETRY
                    /////////////////////
                    var sphere = utils.createSphere({radius: 0.5});
                    var numVertices = sphere.positions.length / 3;
                    var sphereArray = gl.createVertexArray();
                    gl.bindVertexArray(sphereArray);
                    var positionBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(0);
                    var uvBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, sphere.uvs, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(1);
                    var normalBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(2);
                    var color = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, color);
                    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
                    gl.vertexAttribDivisor(3, 1);
                    gl.enableVertexAttribArray(3);
                    // Columns of matrix as separate attributes for instancing
                    var matrixBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, modelMatrixData, gl.DYNAMIC_DRAW);
                    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 64, 0);
                    gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 64, 16);
                    gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 64, 32);
                    gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 64, 48);
                    gl.vertexAttribDivisor(4, 1);
                    gl.vertexAttribDivisor(5, 1);
                    gl.vertexAttribDivisor(6, 1);
                    gl.vertexAttribDivisor(7, 1);
                    gl.enableVertexAttribArray(4);
                    gl.enableVertexAttribArray(5);
                    gl.enableVertexAttribArray(6);
                    gl.enableVertexAttribArray(7);
                    var indices = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
                    // Quad for draw pass
                    var quadArray = gl.createVertexArray();
                    gl.bindVertexArray(quadArray);
                    var quadPositionBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, 1,
                        -1, -1,
                        1, -1,
                        -1, 1,
                        1, -1,
                        1, 1,
                    ]), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(0);
                    //////////////////////
                    // SET UP UNIFORMS
                    //////////////////////
                    var projMatrix = mat4.create();
                    mat4.perspective(projMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, 10.0);
                    var viewMatrix = mat4.create();
                    var eyePosition = vec3.fromValues(0, 0.8, 2);
                    mat4.lookAt(viewMatrix, eyePosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
                    var viewProjMatrix = mat4.create();
                    mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);
                    var lightPosition = vec3.fromValues(1, 1, 2);

                    var sceneUniformData = new Float32Array(24);
                    sceneUniformData.set(viewProjMatrix);
                    sceneUniformData.set(eyePosition, 16);
                    sceneUniformData.set(lightPosition, 20);
                    var sceneUniformBuffer = gl.createBuffer();
                    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, sceneUniformBuffer);
                    gl.bufferData(gl.UNIFORM_BUFFER, sceneUniformData, gl.STATIC_DRAW);
                    var image = new Image();
                    image.onload = function() {
                        ///////////////////////
                        // BIND TEXTURES
                        ///////////////////////
                        var texture = gl.createTexture();
                        gl.activeTexture(gl.TEXTURE0);
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

                        var levels = levels = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
                        gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
                        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
                        gl.generateMipmap(gl.TEXTURE_2D);
                        gl.activeTexture(gl.TEXTURE1);
                        gl.bindTexture(gl.TEXTURE_2D, accumTarget);
                        gl.activeTexture(gl.TEXTURE2);
                        gl.bindTexture(gl.TEXTURE_2D, accumAlphaTarget);
                        gl.useProgram(accumProgram);
                        gl.uniform1i(textureLocation, 0);
                        gl.useProgram(drawProgram);
                        gl.uniform1i(accumLocation, 1);
                        gl.uniform1i(accumAlphaLocation, 2);
                        var rotationMatrix = mat4.create();
                        function draw() {
                            ////////////////////
                            // DRAW BOXES
                            ////////////////////
                            gl.bindFramebuffer(gl.FRAMEBUFFER, accumBuffer);
                            gl.useProgram(accumProgram);
                            gl.bindVertexArray(sphereArray);
                            for (var i = 0, len = spheres.length; i < len; ++i) {
                                spheres[i].rotate[1] += 0.002;
                                utils.xformMatrix(spheres[i].modelMatrix, spheres[i].translate, null, spheres[i].scale);
                                mat4.fromYRotation(rotationMatrix, spheres[i].rotate[1]);
                                mat4.multiply(spheres[i].modelMatrix, rotationMatrix, spheres[i].modelMatrix);

                                modelMatrixData.set(spheres[i].modelMatrix, i * 16);
                            }
                            gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
                            gl.bufferSubData(gl.ARRAY_BUFFER, 0, modelMatrixData);
                            gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
                            gl.clear(gl.COLOR_BUFFER_BIT);
                            gl.drawElementsInstanced(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0, spheres.length);
                            /////////
                            // DRAW
                            /////////
                            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                            gl.useProgram(drawProgram);
                            gl.bindVertexArray(quadArray);
                            gl.clear(gl.COLOR_BUFFER_BIT);
                            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                            gl.drawArrays(gl.TRIANGLES, 0, 6);
                            requestAnimationFrame(draw);
                        }
                        requestAnimationFrame(draw);

                    }
                    image.src = "img/khronos_webgl.png";

          }
    }
    VVVV.Nodes.WebGL2Test.prototype = new Node();
    //VVVV.Nodes.ReactTest.requirements = ["react-dom"];
    //VVVV.Nodes.ReactTest.requirements = ["react"];



});
