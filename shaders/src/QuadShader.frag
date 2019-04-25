#define SHADER_NAME PHASER_QUAD_SHADER_FS

precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

varying vec2 fragCoord;

vec3 hsv2rgb (vec3 c)
{
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main (void)
{
    // Normalized pixel coordinates (from 0 to 1)
    // vec2 uv = fragCoord / resolution.xy;

    // Time varying pixel color
    // vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0,2,4));

    // gl_FragColor = vec4(col, 1.0);

	// vec2 gg = gl_FragCoord.xy;
	vec2 gg = fragCoord.xy;
	float bins = 10.0;
	vec2 pos = (gg / resolution.xy);

    // https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/gl_FragCoord.xhtml

    // vec2 pos = vec2(resolution.x / gl_FragCoord.x, resolution.y / gl_FragCoord.y);

	float bin = floor(pos.x * bins);

	gl_FragColor = vec4(hsv2rgb(vec3(bin/bins, 0.5, 1.0)), 1.0);
}
