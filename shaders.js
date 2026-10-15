export const vs = `#version 300 es
    precision highp float;

    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec3 aColor;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;

    out vec3 vColor;

    void main() {
        gl_Position =
            uProjection *
            uView *
            uModel *
            vec4(aPosition, 1.0);

        vColor = aColor;
    }
`;

export const fs = `#version 300 es
    precision highp float;

    in vec3 vColor;
    out vec4 outColor;

    void main() {
        outColor = vec4(vColor, 1.0);
    }
`;